import { Request, Response } from 'express';
import { validate } from '../utils/validate';
import { HttpError } from '../core/http-error';
import { loginSchema, refreshSchema, registerSchema } from './auth.schemas';
import * as authService from './auth.service';

export const register = async (req: Request, res: Response): Promise<void> => {
  const payload = validate(registerSchema, req.body);
  const result = await authService.register(payload);
  res.status(201).json(result);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const payload = validate(loginSchema, req.body);
  const result = await authService.login(payload);
  res.json(result);
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  const payload = validate(refreshSchema, req.body);
  const result = await authService.refresh(payload.refreshToken);
  res.json(result);
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const payload = validate(refreshSchema, req.body);
  await authService.logout(payload.refreshToken);
  res.status(204).send();
};

export const me = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) throw new HttpError(401, 'Not authenticated');
  const user = await authService.getMe(req.user.userId);
  res.json({ data: user });
};
