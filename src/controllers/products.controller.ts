import { listProducts } from "../services/products.services.js";
import { Request, Response, NextFunction } from "express";
import { successResponse } from "../utils/responseHandler.util.js";

export const listProductsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = await listProducts(req.qtransformed, (req as any).correlationId)
    return successResponse(res, response.code, response.message, response.data, response.meta)
  } catch (error) {
    next(error);
  }
};
