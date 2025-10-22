const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Message = require("../models/message.model");


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
                fullName: newUser.fullName
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
                fullName: user.fullName,
                lastLogin: user.lastLogin
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

async function getMessages(req, res) {
        try {
            const chatId = req.params.chatId;
            const user = req.user; // set by auth middleware

            // Ensure chatId provided
            if (!chatId) {
                return res.status(400).json({ message: 'chatId is required' });
            }

            const messages = await Message.find({ chat: chatId, user: user._id }).sort({ createdAt: 1 }).lean();

            res.status(200).json({
                message: 'Messages fetched successfully',
                messages
            });
        } catch (error) {
            console.error('Get messages error:', error);
            res.status(500).json({ message: 'Internal server error', error: error.message });
        }
}


// backend/src/controllers/auth.controller.js

async function userfind(req, res) {
  try {
    const userId = req.user.id; // depends on your auth middleware
    const user = await userModel.findById(userId).select("fullName email avatar");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar || null
      }
    });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Error fetching user", error: err.message });
  }
}



async function logout(req, res) {
  res.cookie("token", null, {
    httpOnly: true,
    sameSite: "Lax",
    expires: new Date(0),
  });
  res.json({ message: "Logged out successfully" });
}




async function authlogin(req, res) {
  const { name, email, picture } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let user = await userModel.findOne({ email });

    if (!user) {
      const [firstName, lastName] = name ? name.split(" ") : ["User", ""];
      user = await userModel.create({
        fullName: { firstName, lastName },
        email,
        password: `${Date.now()}_auth0`, // temporary placeholder
        picture: picture || "https://wallpapercave.com/wp/wp7395689.jpg",
        lastLogin: new Date()
      });
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate JWT for socket or API auth
    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    // ✅ Always send token back in response
    res.status(200).json({
      message: "Auth0 user synced successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        picture: user.picture,
        lastLogin: user.lastLogin
      },
      token
    });

  } catch (err) {
    console.error("❌ Auth0 login error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
}

  // Edit user profile
async function editProfile(req, res) {
  try {
    const userId = req.user.id; // from auth middleware
    const { fullName, email, picture } = req.body;

    // Validate input
    if (!fullName?.firstName || !fullName?.lastName) {
      return res.status(400).json({ message: "First name and last name are required" });
    }

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if email is taken by another user
    const existingUser = await userModel.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Update user
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      {
        fullName: {
          firstName: fullName.firstName,
          lastName: fullName.lastName
        },
        email,
        ...(picture && { picture }) // only update picture if provided
      },
      { new: true, runValidators: true } // return updated user
    ).select("fullName email picture avatar");

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });

  } catch (err) {
    console.error("Edit profile error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
}

// backend/src/controllers/auth.controller.js

async function deleteAccount(req, res) {
  try {
    const userId = req.user.id;
    console.log("Deleting account for user ID:", userId);
    if (!userId) {
      return res.status(400).json({ message: "User ID missing from token" });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete all messages related to this user (optional)
    await Message.deleteMany({ user: userId });

    // Delete user
    await userModel.findByIdAndDelete(userId);

    // Clear auth cookie
     // 🔹 Clear all cookies
    if (req.cookies) {
      Object.keys(req.cookies).forEach(cookieName => {
        res.cookie(cookieName, "", {
          httpOnly: true,
          expires: new Date(0),
          sameSite: "Lax",
        });
      });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (err) {
    console.error("❌ Delete account error:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
}



module.exports = {
    registerUser,
    loginUser,
   getMessages,
   userfind,
   editProfile,
   logout,
   authlogin,
 deleteAccount
}