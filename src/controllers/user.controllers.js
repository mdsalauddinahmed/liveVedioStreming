 import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { user } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const registerUser = asyncHandler(async(req,res)=>{
     const {fullName,email,username,password}= req.body

     if(
        [fullName,email,username,password].some((field) => field?.trim() === "")
     ){
        throw new ApiError(400, "All fields are required")
     }

     const existedUser = await user.findOne({
        $or: [{username},{email}]
     })

     if(existedUser){
        throw new ApiError(409, "user already exist")
    }

 if (!req.files?.avatar || !req.files.avatar[0]) {
    throw new ApiError(400, "Avatar file is required");
}
const avatarLocalPath = req.files.avatar[0].path;
const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = coverImageLocalPath
  ? await uploadOnCloudinary(coverImageLocalPath)
  : null;

if (!avatar) {
  throw new ApiError(400, "Failed to upload avatar image");
}

const User = await user.create({
  fullName,
  avatar: avatar.url,
  coverImage: coverImage?.url || "",
  email,
  password,
  username: username.toLowerCase(),
});


    const newUser= await user.findById(User._id).select(
      " -password -refreshToken"
    )

    if(!newUser){
      throw new ApiError(500, "Something went wrong please try again later")
    }

    return res.status(201).json(
      new ApiResponse(200,"User created successfully")
    )


    
  




})
export {
    registerUser
}