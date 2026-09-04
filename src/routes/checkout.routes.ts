//ROUTES
import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { checkoutSchema } from "../validators/checkout.schema.js";
import { checkoutController, successController } from "../controllers/checkout.controller.js";

const router = express.Router();

router.post("/", authenticate(), validateRequest(checkoutSchema), checkoutController);

// placeholder
router.get("/", successController)

export default router;
