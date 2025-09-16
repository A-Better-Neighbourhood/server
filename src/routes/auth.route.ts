/** @format */

import { Router } from "express";
import { signIn, signOut, signUp } from "../controllers/auth.controller.js";

/** @format */
const authRouter = Router();

authRouter.post("/signIn", signIn);
authRouter.post("/signup", signUp);
authRouter.post("/signOut",signOut)

export { authRouter };
