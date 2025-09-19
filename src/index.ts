/** @format */
import express from "express";
import { env } from "./configs/env.js";

const app = express();

env.parse(process.env);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on http://localhost:${process.env.PORT}`);
});
