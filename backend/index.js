import express from "express";
import { connectDB } from "./database/connectDB.js";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

dotenv.config();

const app = express();
const __dirname = path.resolve();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
connectDB();

app.use(cookieParser());

app.use("/api/auth", authRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
