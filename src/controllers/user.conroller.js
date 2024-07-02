import { asynchandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import { upLoadOnCloudinary } from "../utils/cloudnary.js";
import  { ApiResponse } from "../utils/ApiResponse.js"
import { response } from "express";

const registerUser = asynchandler(async (req, res, next) => {
    // get user details from frontend
    //validate user details
    //check if user exists : username or email
    //check for image,check for avatar
    //upload to cloudinary,avatar
    //create user object - create entry in database 
    //remove password and refresh token field from response
    //check for user creation

    const { username, email, password , fullName  } = req.body;
    
    if ([username, email, password, fullName].some((feild) => feild?.trim === "")) {
        throw new ApiError(400 ,"All fields are required");
    };



    const existUser = await User.findOne({ 
        $or: [{ username }, { email }]
     })

     if (existUser) {
        throw new ApiError(409 ,"User already exists");
     };


     const avatarLocalPath = req.files?.avatar[0]?.path;
     const coverImageLocalPath = req.files?.coverImage[0]?.path;
     if(!avatarLocalPath) {
        throw new ApiError(400 ,"Avatar is required");
     };

   const avatar = await upLoadOnCloudinary(avatarLocalPath);
   const coverImage = await upLoadOnCloudinary(coverImageLocalPath);

   if(!avatar){
    throw new ApiError(400 ,"Error uploading avatar");
   }


   User.create({ fullName,
    avatar : avatar.url, 
    coverImage : coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password
})

const createUser = await User.findById(User._id).select(
    " -password -refreshToken "
)

if(!createUser) {
    throw new ApiError(500 ,"Something went wrong while registering user");
}

return res.status(201).json(
    new ApiResponse (200,createUser , "User register succesfilly")
)

})


export { registerUser }