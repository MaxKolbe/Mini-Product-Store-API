//ROUTES
import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { getOrdersController } from "../controllers/orders.controller.js";
import { paginationQuerySchema } from "../validators/global.schema.js";

const router = express.Router();

router.get("/", authenticate(), validateRequest(paginationQuerySchema), getOrdersController);

export default router;
