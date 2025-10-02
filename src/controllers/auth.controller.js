const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

async function registerUser(req, res) {
    try {
        const { fullName:{firstName, lastName}, email, password } = req.body;

        const userExists = await userModel.findOne({email});

        if(userExists){
            return res.status(400).json({
                message:"User already exists"
            });
        }

        // Input validation
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                message: "All fields are required: email, password, firstName, lastName"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await userModel.create({
            fullName: {
                firstName,
                lastName
            },
            email,
            password: hashedPassword
        });

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET);
        res.cookie("token", token);

        // Fix: Remove redundant save() and fix the response
        res.status(201).json({
            message: "User registered successfully",
            user: {
                email: newUser.email,
                _id: newUser._id,  // Fix: Changed from user._id to newUser._id
                fullName: {
                    firstName: newUser.fullName.firstName,
                    lastName: newUser.fullName.lastName
                }
            }
        });

    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}


async function loginUser(req, res) {
    try {
        const { email, password } = req.body;

        // Check if JWT_SECRET exists
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.cookie("token", token, { httpOnly: true });

        res.status(200).json({
            message: "User logged in successfully",
            user: {
                email: user.email,
                fullName: user.fullName
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Internal server error",
            error: error.message
        });
    }
}

module.exports = {
    registerUser,
    loginUser
}