//ROUTES
import express from "express";
// import { authenticate } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { listProductsController } from "../controllers/products.controller.js";
import { paginationQuerySchema } from "../validators/global.schema.js";

const router = express.Router();

router.get("/", validateRequest(paginationQuerySchema), listProductsController);

export default router;
