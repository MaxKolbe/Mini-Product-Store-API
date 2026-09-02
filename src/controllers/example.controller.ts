import { exampleService } from "../services/example.services.js";
import { Request, Response, NextFunction } from "express";

export const exampleController = async (req: Request, res: Response, next: NextFunction) => {
  try {
  } catch (error) {
    next(error);
  }
};
