import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string;};
      qtransformed?: any; // for tranformations made to req.query
      correlationId?: string;
    }
  }
}