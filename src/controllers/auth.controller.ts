import { register } from "../services/auth.services.js"
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/responseHandler.util.js";

export const registerUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await register(req.body, (req as any).correlationId)
    return successResponse(res, response.code, response.message, response.data, response.meta)
  } catch (error) {
    next(error);
  }
};
