// src/utils/jwt.util.ts
// JWT utilities for access + refresh tokens.
// Requires `npm i jsonwebtoken`.
// env vars used:
// - ACCESS_TOKEN_SECRET
// - REFRESH_TOKEN_SECRET
// - ACCESS_TOKEN_EXPIRES_IN (e.g. "15m")
// - REFRESH_TOKEN_EXPIRES_IN (e.g. "7d")

import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET || 'dev-access-secret';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret';
const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export type AccessPayload = {
  sub: string; // user id
  email: string;
  role?: string;
};

export type RefreshPayload = {
  sub: string; // user id
};

// sign access token
export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

// sign refresh token (returns token string)
export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

// verify access token, throws if invalid
export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessPayload;
}

// verify refresh token, throws if invalid
export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshPayload;
}

// helper to compute expiresAt Date for refresh tokens (rough parsing: n d/h/m)
export function computeRefreshTokenExpiryDate(): Date {
  // simple parsing: supports "Nd", "Nh", "Nm", or plain ms number
  const s = process.env.REFRESH_TOKEN_EXPIRES_IN || REFRESH_EXPIRES_IN;
  const now = Date.now();
  if (/^\d+$/.test(s)) {
    return new Date(now + Number(s));
  }
  const match = s.match(/^(\d+)([dhm])$/);
  if (match) {
    const v = Number(match[1]);
    const unit = match[2];
    const mult = unit === 'd' ? 24 * 60 * 60 * 1000 : unit === 'h' ? 60 * 60 * 1000 : 60 * 1000;
    return new Date(now + v * mult);
  }
  // default: 7 days
  return new Date(now + 7 * 24 * 60 * 60 * 1000);
}
