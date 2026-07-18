import { z } from 'zod';

const email = z.string().trim().toLowerCase().email().max(150);
const password = z.string().min(8).max(72);

const customerRegisterSchema = z.object({
  role: z.literal('customer'),
  email,
  password,
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(20).optional(),
});

const restaurantOwnerRegisterSchema = z.object({
  role: z.literal('restaurant_owner'),
  email,
  password,
  restaurant_name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(20).optional(),
  address: z.string().trim().optional(),
});

const deliveryAgentRegisterSchema = z.object({
  role: z.literal('delivery_agent'),
  email,
  password,
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(20),
  vehicle_number: z.string().trim().max(50).optional(),
});

export const registerSchema = z.discriminatedUnion('role', [
  customerRegisterSchema,
  restaurantOwnerRegisterSchema,
  deliveryAgentRegisterSchema,
]);

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({ email, password });
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({ refreshToken: z.string().min(1) });
export type RefreshInput = z.infer<typeof refreshSchema>;
