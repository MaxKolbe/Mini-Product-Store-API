import { listOrders } from "../services/orders.services.js";
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/responseHandler.util.js";
import { UnauthorizedError } from "../lib/error.js";

export const getOrdersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError();
    }

    const response = await listOrders(req.user.id, req.qtransformed, (req as any).correlationId);
    return successResponse(res, response.code, response.message, response.data, response.meta);
  } catch (error) {
    next(error);
  }
};
