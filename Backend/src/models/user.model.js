const mongoose = require("mongoose");


const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    picture:{
        type:String,
        default:"https://wallpapercave.com/wp/wp7395689.jpg",
        unique:true
    },
  
   

    fullName:{
        firstName:{
           type:String,
        // required:true,
        },
        lastName:{
            type:String,
        // required:true,
        }
    },
    password:{
        type:String,
        // required:true,
    },
    lastLogin: {
        type: Date
      },
      profileSlug: {
        type: String,
        unique: true,
        lowercase: true,
        trim: true
      },
}
,
    {
        timestamps:true
    })

const userModel = mongoose.model("user",userSchema);
module.exports = userModel;



// backend @user.model.js @auth.controller.js @firebase-service-account.json @app.js @firebaseAdmin.js @server.js  @package.json  frontend @Login.jsx @firebase.js @package.json  in login.jsx i am click (lgoin with google) button show email to login show login activitie is complete but show login.jsx page and not save user data in database what is error in my code fix code what is reason this issue show