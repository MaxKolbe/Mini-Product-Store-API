import jwt from "jsonwebtoken";
import { TokenPayload } from "../types/auth.js";
import { env } from "../configs/env.config.js"

const JWT_SECRET = env.JWT_SECRET;

export const generateToken = (user: { id: string; email: string;}) => {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "20m" });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};


