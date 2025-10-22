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
},
    {
        timestamps:true
    })

const userModel = mongoose.model("user",userSchema);
module.exports = userModel;



