const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const chatController = require("../controllers/chat.controller")


const router = express.Router();

// post /api/chat/
router.post("/", authMiddleware.authUser, chatController.createChat)
// get /api/chat/ - return list of chats for the authenticated user
router.get("/", authMiddleware.authUser, chatController.getChats)

// PATCH /api/chat/:id - rename chat
router.patch("/:id", authMiddleware.authUser, chatController.renameChat);

// DELETE /api/chat/:id - delete chat
router.delete("/:id", authMiddleware.authUser, chatController.deleteChat);


router.get("/share/:id", authMiddleware.authUser, chatController.shareChat);

module.exports = router;