const mongoose = require("mongoose");

async function connectDB(){
    try {
        if (!process.env.MONGO_URL) {
            throw new Error("MONGO_URL environment variable is not defined");
        }
        
        await mongoose.connect(process.env.MONGO_URL);
        console.log("DB connected successfully");
    } catch (err) {
        console.error("DB connection failed:", err.message);
        process.exit(1); // Exit the process on database connection failure
    }
}

module.exports = connectDB;
