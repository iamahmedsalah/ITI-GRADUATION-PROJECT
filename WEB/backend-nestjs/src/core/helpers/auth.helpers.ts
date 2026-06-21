import * as crypto from 'node:crypto';
import { Response } from 'express';
import * as jwt from 'jsonwebtoken';

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export const generateVerificationCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

export const signJwt = (
  payload: string | Buffer | object,
  secret: string,
  expiresIn: string | number = '7d',
) => jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);

export const setAuthCookie = (res: Response, token: string, maxAgeMs: number) => {
  res.cookie('jwt', token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeMs,
  });
};
