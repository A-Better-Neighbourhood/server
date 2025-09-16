/** @format */
import express from "express";
import { indexRouter } from "./routes/index.route.js";

const app = express();

app.use("/api",indexRouter)

app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
