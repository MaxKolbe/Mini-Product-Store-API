//ROUTES
import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateRequest } from "../middleware/validate.middleware.js";
import { exampleController } from "../controllers/example.controller.js";

const router = express.Router();

router.post("/signup", exampleController);
router.post("/login", exampleController);
