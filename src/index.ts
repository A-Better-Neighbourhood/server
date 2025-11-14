/** @format */
import express from "express";
import { env } from "./configs/env";
import morgan from "morgan";
import { router } from "./routes/index.route";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

const app = express();

const envVars = env.parse(process.env);

// CORS origins based on environment
const allowedOrigins = [
  envVars.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:3001",
];

// Add production frontend URL if different from env var
if (envVars.NODE_ENV === "production") {
  allowedOrigins.push("https://abn-phi.vercel.app");
}

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  })
);
app.use(express.json({ limit: "10mb" })); // Increase limit for base64 images
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.use("/api", router);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

const PORT = 3080;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
