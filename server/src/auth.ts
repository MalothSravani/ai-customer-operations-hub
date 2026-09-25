import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "./config";

export type AuthUser = { userId: string; organizationId: string; role: string };

export function signToken(user: AuthUser) {
  return jwt.sign(user, config.jwtSecret, { expiresIn: "7d" });
}

export function auth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });
  try {
    (req as any).user = jwt.verify(header.slice(7), config.jwtSecret) as AuthUser;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;
    if (!roles.includes(role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}
