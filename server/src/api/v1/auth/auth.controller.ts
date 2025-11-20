import type { Request, Response } from 'express';

export async function register(req: Request, res: Response) {
  const { email } = req.body;
  return res.json({
    id: 'user-1',
    email
  });
}

export async function login(req: Request, res: Response) {
  const { email } = req.body;
  return res.json({
    token: `mock-token-for-${email}`
  });
}

