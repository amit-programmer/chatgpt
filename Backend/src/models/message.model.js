const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "chat",
    },
    content: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ["user", "model", "system"],
        default: "user"
    }
}, {
    timestamps: true
});

// Create and export the model
const Message = mongoose.model("Message", messageSchema);
module.exports = Message;               