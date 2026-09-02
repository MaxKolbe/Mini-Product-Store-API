import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/token.util.js";
import { UnauthorizedError } from "../lib/error.js";

export const authenticate = () => async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies["accesstoken"];

  if (!token) throw new UnauthorizedError("No token provided");

  try {
    const payload = verifyToken(token);

    req.user = { id: payload.sub };

    next();
  } catch (error: any) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError("Token expired");
    }

    throw new UnauthorizedError("Invalid token");
  }
};
