import { prisma } from '../lib/prisma';
import { HttpError, ConflictError } from '../core/http-error';
import { hashPassword, verifyPassword } from './password';
import { signAccessToken } from './jwt';
import { issueRefreshToken, rotateRefreshToken, revokeRefreshToken } from './refresh-token-store';
import type { RegisterInput, LoginInput } from './auth.schemas';
import type { user_role } from '../generated/prisma/enums';

export interface AuthResult {
  user: { user_id: number; email: string; role: user_role };
  accessToken: string;
  refreshToken: string;
}

async function issueTokenPair(userId: number, role: user_role) {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = await issueRefreshToken(userId);
  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.users.findUnique({ where: { email: input.email } });
  if (existing) throw new ConflictError('An account with this email already exists');

  const password_hash = await hashPassword(input.password);
  const user = await prisma.users.create({ data: { email: input.email, password_hash, role: input.role } });

  try {
    if (input.role === 'customer') {
      await prisma.customers.create({
        data: { name: input.name, email: input.email, phone: input.phone, user_id: user.user_id },
      });
    } else if (input.role === 'restaurant_owner') {
      await prisma.restaurants.create({
        data: {
          name: input.restaurant_name,
          email: input.email,
          phone: input.phone,
          address: input.address,
          owner_user_id: user.user_id,
        },
      });
    } else {
      await prisma.delivery_agents.create({
        data: {
          name: input.name,
          phone: input.phone,
          vehicle_number: input.vehicle_number,
          user_id: user.user_id,
        },
      });
    }
  } catch (err) {
    // Neon's pooled connection doesn't reliably support interactive transactions, so we
    // compensate manually: if the profile row fails, remove the orphaned user we just created.
    await prisma.users.delete({ where: { user_id: user.user_id } }).catch(() => undefined);
    throw err;
  }

  const tokens = await issueTokenPair(user.user_id, user.role);
  return { user: { user_id: user.user_id, email: user.email, role: user.role }, ...tokens };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.users.findUnique({ where: { email: input.email } });
  if (!user) throw new HttpError(401, 'Invalid email or password');

  const valid = await verifyPassword(input.password, user.password_hash);
  if (!valid) throw new HttpError(401, 'Invalid email or password');

  const tokens = await issueTokenPair(user.user_id, user.role);
  return { user: { user_id: user.user_id, email: user.email, role: user.role }, ...tokens };
}

export async function refresh(rawToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const { userId, token } = await rotateRefreshToken(rawToken);
  const user = await prisma.users.findUnique({ where: { user_id: userId } });
  if (!user) throw new HttpError(401, 'Invalid or expired refresh token');

  const accessToken = signAccessToken({ sub: user.user_id, role: user.role });
  return { accessToken, refreshToken: token };
}

export async function logout(rawToken: string): Promise<void> {
  await revokeRefreshToken(rawToken);
}

export async function getMe(userId: number) {
  const user = await prisma.users.findUnique({
    where: { user_id: userId },
    select: {
      user_id: true,
      email: true,
      role: true,
      created_at: true,
      customer: true,
      restaurant: true,
      delivery_agent: true,
    },
  });
  if (!user) throw new HttpError(401, 'User not found');
  return user;
}
