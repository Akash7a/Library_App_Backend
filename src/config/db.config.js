import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
import dotenv from "dotenv";

dotenv.config({
    path:"../.env"
});

export const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}?retryWrites=true&w=majority`);
        console.log(`MongoDB connection HOST:: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error(`MongoDB connection failed: ${error.message}`);
    }
};