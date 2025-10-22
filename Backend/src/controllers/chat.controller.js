const chatModel = require("../models/chat.model");
const Message = require("../models/message.model"); 

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
                lastActivity: chat.lastActivity, // Fixed typo in property name
                user: chat.user
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

async function getChats(req, res) {
    try {
        const user = req.user;
        const chats = await chatModel.find({ user: user._id }).sort({ updatedAt: -1 }).lean();

        res.status(200).json({
            message: "Chats fetched successfully",
            chats
        });
    } catch (error) {
        console.error("Get chats error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}



// Rename chat
async function renameChat (req, res) {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "Title is required" });
    }

    const chat = await chatModel.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { title },
      { new: true }
    );

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    res.json({ message: "Chat renamed", chat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete chat
async function deleteChat(req, res) {
  try {
    const { id } = req.params;
    const chat = await chatModel.findOneAndDelete({ _id: id, user: req.user._id });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    res.json({ message: "Chat deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


async function shareChat(req, res) {
  try {
    const chat = await chatModel.findById(req.params.id).lean();
    if (!chat) return res.status(404).json({ message: 'Chat not found' });

    const messages = await Message.find({ chat: chat._id })
                                  .sort({ createdAt: 1 })
                                  .populate("user", "fullName")
                                  .lean();

    const formattedMessages = messages.map(m => ({
      sender: m.role === "user" ? m.user?.fullName?.firstName || "User" : "AI",
      text: m.content
    }));

    res.json({ title: chat.title, messages: formattedMessages });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}




module.exports = {
    createChat, 
    getChats, 
    shareChat,
    deleteChat, 
renameChat
};