/** @format */
import {Router} from "express";
import { authRouter } from "./auth.route.js";

const indexRouter = Router();

indexRouter.use("/auth",authRouter);

export {indexRouter};