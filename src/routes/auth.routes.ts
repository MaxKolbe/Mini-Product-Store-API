//ROUTES
import express from "express";
import { validateRequest } from "../middleware/validate.middleware.js";
import { registerUserController } from "../controllers/auth.controller.js";
import { userSchema } from "../validators/auth.schema.js";

const router = express.Router();

router.post("/register", validateRequest(userSchema), registerUserController);
// router.post("/login", exampleController);

export default router;
