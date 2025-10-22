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
       
    }
}

module.exports = connectDB;
