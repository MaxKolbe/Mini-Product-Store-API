import { register, login } from "../services/auth.services.js";
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/responseHandler.util.js";
import { cookieOptions } from "../lib/cookies.js";

export const registerUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await register(req.body, (req as any).correlationId);
    return successResponse(res, response.code, response.message, response.data, response.meta);
  } catch (error) {
    next(error);
  }
};

export const loginUserController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await login(req.body, (req as any).correlationId);
    res.cookie("accesstoken", response.meta.token, cookieOptions);
    return successResponse(res, response.code, response.message, response.data, response.meta);
  } catch (error) {
    next(error);
  }
};
