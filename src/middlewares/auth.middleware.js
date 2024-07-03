import  { asynchandler }   from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asynchandler(async (req, _ , next) => {
   try {
    const token = req.cookies.accessToken || 
    req.header("Authorization")?.replce ("Bearer ", "");
 
    if (!token) {
     throw new ApiError(401, "Unauthorized");
    }
 
    const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET);
 
   const user = await User.findById(decodedToken._id).select("-password -refreshToken")
 
   if (!user) {
     throw new ApiError(401, "Invalid token");
   }
 
   req.user = user;
 
   next();
   } catch (error) {
    throw new ApiError(401,error?.message || "Invalid token");
    
   }
})