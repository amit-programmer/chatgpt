const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const messageModel = require("../models/message.model");
const userModel = require("../models/user.model");
const { generateResponse, generateVector } = require("../services/ai.service");
const { createMemory, queryMemory } = require("../services/vector.service");



function initSocketServer(httpServer) {
    const io = new Server(httpServer, {
       
    });

    io.use(async (socket, next) => {
        try {
            const cookies = cookie.parse(socket.handshake.headers?.cookie || "");
            console.log("Parsed cookies:", cookies); // Debug log

            if (!cookies.token) {
                throw new Error("No token found");
            }

            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
            
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

    io.on("connection", (socket,next) => {
        console.log("User connected:", socket.user);
       
        socket.on("ai-message", async (messagePayload) => {

            // messagePayload = {chat:chatId, content: "message text"}
        //    const message =  
           await messageModel.create({
                user: socket.user._id,
                chat: messagePayload.chat,
                content: messagePayload.content || messagePayload.message,
                role: "user"
            });
            
            // const vectors = await generateVector(messagePayload.content)

        //      const memory = await queryMemory({
        //     queryVectors: vectors,
        //     limit: 3,
        //     metadata: {}
        // })

            
        //  await createMemory({
        //     vectors,
        //     messageId: message._id,
        //     metadata:{
        //      chat: messagePayload.chat,
        //      user: socket.user._id,
        //      text: messagePayload.content
        //     } 
        //  })

            // console.log({"vectors": vectors})

    try {
        // const userMessage = messagePayload.content || messagePayload.message;
        
        // if (!userMessage) {
        //     throw new Error("Message content is required");
        // }

       
        // console.log("memory : ", memory)

        const chatHistory = (await messageModel.find({ chat: messagePayload.chat 
        }).sort({ createdAt: -1 }).limit(20).lean()).reverse();

     

       // Format chat history properly for Gemini
const formattedHistory = chatHistory.map(item => ({
    role: item.role === "ai" ? "model" : "user",  // normalize roles
    parts: item.content ? [{ text: item.content }] : [] // avoid empty parts
}));

const response = await generateResponse(formattedHistory);


    //    const responseMessage = 
       await messageModel.create({
            user: socket.user._id,
            chat: messagePayload.chat,
            content: response,
            role: "ai"
        });

        // const responseVectors = await generateVector(response);

        // await createMemory({
        //     vectors: responseVectors,
        //     messageId: responseMessage._id,
        //     metadata:{
        //         chat: messagePayload.chat,
        //         user: socket.user._id,
        //         text: response
        //     }
        // })

        socket.emit("ai-response", {
            content: response,
            chat: messagePayload.chat,
        });
    } catch (error) {
        console.error("AI message error:", error);
        socket.emit("ai-error", {
            message: "Failed to generate AI response",
            chat: messagePayload?.chat
        });
    }
});


        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.user._id);
        });
    });

    return io;
}


module.exports = initSocketServer;