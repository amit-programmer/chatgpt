const express = require("express");
const authController = require("../controllers/auth.controller");
const router = express.Router(); // Add parentheses to call the function

router.post("/register", authController.registerUser);
router.post("/login", authController.loginUser);

module.exports = router;