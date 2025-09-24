/** @format */
import express from "express";
import { env } from "./configs/env.js";
import { authRouter } from "./routes/auth.route.js";
import { router } from "./routes/index.route.js";

const app = express();

// Parse environment variables
env.parse(process.env);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api", router);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
