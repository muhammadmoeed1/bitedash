import { randomUUID, createHash } from 'node:crypto';
import { prisma } from '../lib/prisma';
import { HttpError } from '../core/http-error';
import { env } from '../config/env';
import { signRefreshToken, verifyRefreshToken } from './jwt';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function issueRefreshToken(userId: number): Promise<string> {
  const jti = randomUUID();
  const token = signRefreshToken({ sub: userId, jti });
  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  await prisma.refresh_tokens.create({
    data: { user_id: userId, token_hash: hashToken(token), expires_at: expiresAt },
  });

  return token;
}

/** Verifies a refresh token, revokes it, and issues a replacement (rotation). Throws if invalid/expired/revoked. */
export async function rotateRefreshToken(rawToken: string): Promise<{ userId: number; token: string }> {
  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw new HttpError(401, 'Invalid or expired refresh token');
  }

  const tokenHash = hashToken(rawToken);
  const stored = await prisma.refresh_tokens.findFirst({
    where: { user_id: payload.sub, token_hash: tokenHash, revoked_at: null },
  });

  if (!stored || stored.expires_at < new Date()) {
    throw new HttpError(401, 'Invalid or expired refresh token');
  }

  await prisma.refresh_tokens.update({
    where: { token_id: stored.token_id },
    data: { revoked_at: new Date() },
  });

  const token = await issueRefreshToken(payload.sub);
  return { userId: payload.sub, token };
}

export async function revokeRefreshToken(rawToken: string): Promise<void> {
  const tokenHash = hashToken(rawToken);
  await prisma.refresh_tokens.updateMany({
    where: { token_hash: tokenHash, revoked_at: null },
    data: { revoked_at: new Date() },
  });
}
