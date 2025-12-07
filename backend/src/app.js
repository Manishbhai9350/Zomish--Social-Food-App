import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Routes
import { AuthRouter } from "./routes/auth/route.js";
import { FoodRouter } from "./routes/food/route.js";
import { Connect } from "./db/mongo.database.js";
import morgan from "morgan";
import { UserRouter } from "./routes/user/route.js";

console.clear();

dotenv.config({ debug: true });
Connect();

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(
  cors({
    origin: process.env.FRONTEND_ENDPOINT, // Vite default frontend URL
    credentials: true,
  })
);
app.use(cookieParser());

// Routes
app.use("/auth", AuthRouter);
app.use("/api/food", FoodRouter);
app.use("/api/user", UserRouter);

app.listen(3000, () => {
  console.log(`http://localhost:3000`);
});
