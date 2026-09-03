//ROUTES
import express from "express";
import { validateRequest } from "../middleware/validate.middleware.js";
import { registerUserController, loginUserController } from "../controllers/auth.controller.js";
import { userSchema } from "../validators/auth.schema.js";

const router = express.Router();

router.post("/register", validateRequest(userSchema), registerUserController);
router.post("/login", validateRequest(userSchema), loginUserController);

export default router;
