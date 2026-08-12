import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./routes/authRoutes.js";
import profileRouter from "./routes/profileRoutes.js";
import connectionRequestRouter from "./routes/connectionRequestRoutes.js";
import userRouter from "./routes/userRoutes.js";
import cors from "cors";
import chatRouter from "./routes/chatRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";

const app = express();

// In production the frontend is served from the same origin as the API, so
// requests are never cross-origin and CORS is unnecessary. Only mount it in
// development, where Vite runs on a separate port.
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:5173",
      credentials: true,
    }),
  );
}

app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", connectionRequestRouter);
app.use("/", paymentRouter);
app.use("/", userRouter);
app.use("/", chatRouter);

export default app;
