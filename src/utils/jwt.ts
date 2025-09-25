/** @format */

import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = 24 * 60 * 60 * 1000; // 24 hours

export interface JwtPayload {
  userId: string;
  contactNo: string;
}

export function generateToken(payload: JwtPayload): string {
  const JWT_SECRET = process.env.JWT_SECRET;

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyToken(token: string): JwtPayload | null {
  const JWT_SECRET = process.env.JWT_SECRET;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromHeader(
  authHeader: string | undefined
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}
