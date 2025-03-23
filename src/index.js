import { connectDB } from "./config/db.config.js";
import { app } from "./app.js";

const port = process.env.PORT || 5000;
connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`App is running on PORT :: ${port}`);
        });
    }).catch((error) => {
        console.error(`MongoDB connection failed ERROR :: ${error}`);
    });