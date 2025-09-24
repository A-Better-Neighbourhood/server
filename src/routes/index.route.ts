/** @format */

import { Router } from "express";
import { issuesRouter } from "./issues.route";

const router = Router();

router.use("/issues", issuesRouter);

export { router };
