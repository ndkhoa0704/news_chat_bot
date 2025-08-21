import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import authRouter from "./routes/authRoutes.js";
import chatRouter from "./routes/chatRoutes.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authRouter);
app.use("/api/chat", chatRouter);

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        app.listen(process.env.PORT, (err) => {
            console.log("Connected to MongoDB");
            if (err) {
                console.log("Error starting the server", err);
            }
            console.log(`Server is running on port ${process.env.PORT}`);
        });
    })
    .catch((err) => {
        console.log("Error connecting to MongoDB", err);
    });

