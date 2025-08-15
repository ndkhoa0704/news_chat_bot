import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { config } from "./config.js";


const app = express();

app.use(helmet());

mongoose.connect(config.DB_URL)
    .then(() => {
        app.listen(config.WEB_PORT, (err) => {
            console.log("Connected to MongoDB");
            if (err) {
                console.log("Error starting the server", err);
            }
            console.log(`Server is running on port ${config.WEB_PORT}`);
        })
    })
    .catch((err) => {
        console.log("Error connecting to MongoDB", err);
    })

