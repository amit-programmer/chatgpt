const express = require("express");
const authController = require("../controllers/auth.controller");
const router = express.Router(); // Add parentheses to call the function

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);
// GET /api/auth/messages/:chatId - return messages for a chat (requires auth)
const authMiddleware = require("../middlewares/auth.middleware");
router.get("/messages/:chatId", authMiddleware.authUser, authController.getMessages);

router.get("/me", authMiddleware.authUser, authController.userfind);




router.post("/logout", authController.logout);


router.post("/auth0-login", authController.authlogin)

router.patch("/profile", authMiddleware.authUser, authController.editProfile);

router.delete("/delete-account", authMiddleware.authUser, authController.deleteAccount);


module.exports = router;