/** @format */
import express from "express";
import { env } from "./configs/env";
import morgan from "morgan";
import { router } from "./routes/index.route";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

env.parse(process.env);

app.use(
  cors({
    origin: ["*"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

const PORT = 3080;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
