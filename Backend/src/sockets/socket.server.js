const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const messageModel = require("../models/message.model");
const userModel = require("../models/user.model");
const aiService = require("../services/ai.service");
const { createMemory, queryMemory } = require("../services/vector.service");

function initSocketServer(httpServer) {
  // Allow CORS for the frontend dev server and allow credentials (cookies)
  const clientOrigin = process.env.CLIENT_URL || "http://localhost:5173";
  const io = new Server(httpServer, {
    cors: {
      origin: clientOrigin,
    allowedHeaders: [ "Content-Type", "Authorization" ],
            credentials: true
    },
  });

  io.use(async (socket, next) => {
    try {
     // Prefer token from socket auth (frontend) instead of cookies
    const token =
      socket.handshake.auth?.token ||
      cookie.parse(socket.handshake.headers?.cookie || "").token;

    if (!token) {
      console.error("❌ Socket Auth Error: No JWT token provided");
      return next(new Error("jwt must be provided"));
    }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await userModel.findById(decoded.id);
      if (!user) {
        throw new Error("User not found");
      }

      socket.user = user;
      next();
    } catch (err) {
      console.error("Socket authentication error:", err.message);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.user);

    socket.on("ai-message", async (messagePayload) => {
      try {
        console.log("message payload : ", messagePayload);

        // Accept either `content` (frontend) or `message` (older server payloads)
        const content = messagePayload.content || messagePayload.message;

        if (!content) {
          throw new Error("Message content is required");
        }

        // Save user message first
        //            const message = await messageModel.create({
        //                     user: socket.user._id,
        //                     chat: messagePayload.chat,
        //                     content: messagePayload.message,
        //                     role: "user"
        //                 });

        // const vectors = await aiService.generateVector(messagePayload.message)

        const [message, vectors] = await Promise.all([
          messageModel.create({
            user: socket.user._id,
            chat: messagePayload.chat,
            content,
            role: "user",
          }),

          aiService.generateVector(content),
        ]);
        console.log("vectors : ", vectors);

        await createMemory({
          vectors,
          messageId: message._id,
          metadata: {
            chat: messagePayload.chat,
            user: socket.user._id,
            text: message.content,
          },
        });



    const memory = await queryMemory({
                queryVectors: vectors,
                limit: 3,
                metadata: {
                    user: socket.user._id,
                }
            })
            console.log("memory : ", memory)
  
            const chatHistory = (await messageModel.find({
                chat:messagePayload.chat
            }).sort({ createdAt: -1 }).limit(20).lean()).reverse();

        // const [memory, chatHistory] = await Promise.all([
        //   queryMemory({
        //     queryVector: vectors,
        //     limit: 3,
        //     metadata: {
        //       user: socket.user._id,
        //     },
        //   }),

        //   messageModel
        //     .find({
        //       chat: messagePayload.chat,
        //     })
        //     .sort({ createdAt: -1 })
        //     .limit(20)
        //     .lean()
        //     .then(messages => messages.reverse())
        // ]);

        // console.log("memory : ", memory);

        const stm = chatHistory.map((item) => {
          return {
            role: item.role,
            parts: [{ text: item.message || item.content }],
          };
        });

        const ltm = [
          {
            role: "user",
            parts: [
              {
                text: `these are some previous messages from the chat, use them to generate a response

                        ${memory.map((item) => item.metadata.text).join("\n")}`,
              },
            ],
          },
        ];


        console.log("LTM:", ltm[0]);
        console.log("STM:", stm);

        // Generate AI response
        const response = await aiService.generateResponse([...ltm, ...stm]);

        console.log("AI response to be sent:", response);

        // Save AI response

        socket.emit("ai-response", {
          content: response,
          chat: messagePayload.chat,
        });

        const [responseMessage, responseVector] = await Promise.all([
          messageModel.create({
            chat: messagePayload.chat,
            user: socket.user._id,
            content: response,
            role: "model",
          }),

          aiService.generateVector(response),
        ]);

        await createMemory({
          vectors: responseVector,
          messageId: responseMessage._id,
          metadata: {
            chat: responseMessage.chat,
            user: socket.user._id,
            text: response,
          },
        });

     


      } catch (error) {
        console.error("AI message error:", error);
        socket.emit("ai-error", {
          message: "Failed to generate AI response",
          chat: messagePayload?.chat,
        });
      }

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.user._id);
      });
    });
  });

  return io;
}

module.exports = initSocketServer;
