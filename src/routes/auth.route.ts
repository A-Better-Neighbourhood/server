/** @format */

import { Router } from "express";
import { signIn, signUp, getProfile } from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const authRouter = Router();

// Public routes
authRouter.post("/signin", signIn);
authRouter.post("/signup", signUp);

// Protected routes
authRouter.get("/profile", authMiddleware, getProfile);

export { authRouter };
