import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/responseHandler.util.js";
import { checkout } from "../services/checkout.services.js";

export const checkoutController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await checkout(req.body, (req as any).correlationId, (req as any).user)
    return successResponse(res, 200, response.message, response.data, response.meta)
  } catch (error) {
    next(error);
  }
};


export const successController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return successResponse(res, 200, "payment made successfully", null)
  } catch (error) {
    next(error);
  }
};