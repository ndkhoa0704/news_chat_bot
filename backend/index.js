import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import config from "./config.js";
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
    .connect(config.MONGO_URL)
    .then(() => {
        app.listen(config.WEB_PORT, (err) => {
            console.log("Connected to MongoDB");
            if (err) {
                console.log("Error starting the server", err);
            }
            console.log(`Server is running on port ${config.WEB_PORT}`);
        });
    })
    .catch((err) => {
        console.log("Error connecting to MongoDB", err);
    });

