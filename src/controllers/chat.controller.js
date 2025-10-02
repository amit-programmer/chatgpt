const chatModel = require("../models/chat.model");

async function createChat(req, res) {
    try {
        if (!req.body || !req.body.title) {
            return res.status(400).json({
                message: "Title is required"
            });
        }

        const {title} = req.body;
        const user = req.user;

        const chat = await chatModel.create({
            user: user._id,
            title
        });

        res.status(201).json({
            message: "Chat created successfully",
            chat: {
                _id: chat._id,
                title: chat.title,
                lastActivity: chat.lastActivity // Fixed typo in property name
            }
        });
    } catch (error) {
        console.error("Create chat error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}

module.exports = {createChat};