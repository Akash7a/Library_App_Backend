import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

dotenv.config({
  path: "../.env",
});

app.use(cors({
  origin: "https://library-app-frontend-hlss.onrender.com",
  credentials: true,
  allowedHeaders: 'Content-Type, Authorization'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import { adminRouter } from "./routes/admin.route.js";
import { studentRouter } from "./routes/student.route.js";
import { whatsappRouter } from "./routes/whatsapp.route.js";

app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/student", studentRouter);
app.use("/api/v1/whatsapp",whatsappRouter);

export { app };
