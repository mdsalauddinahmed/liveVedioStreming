 import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshToken = async(userId)=>{
    try{
      const user = await User.findById(userId)
      const accessToken = user.generateAccessToken()
      const refreashToken = user.generateRefreshToken()

      user.refreashToken = refreashToken
      await user.save({validateBeforeSave:false})

      return {accessToken,refreashToken}
    }catch(error){
      throw new ApiError(500,"sonething went wrong, please try again later")
    }
}



const registerUser = asyncHandler(async(req,res)=>{
     const {fullName,email,username,password}= req.body

     if(
        [fullName,email,username,password].some((field) => field?.trim() === "")
     ){
        throw new ApiError(400, "All fields are required")
     }

     const existedUser = await User.findOne({
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

const createdUser = await User.create({
  fullName,
  avatar: avatar.url,
  coverImage: coverImage?.url || "",
  email,
  password,
  username: username.toLowerCase(),
});


    const newUser= await User.findById(createdUser._id).select(
      " -password -refreshToken"
    )

    if(!newUser){
      throw new ApiError(500, "Something went wrong please try again later")
    }

    return res.status(201).json(
      new ApiResponse(200,"User created successfully")
    )


    
})


const loginUser = asyncHandler(async(req,res) =>{
   const {email,username, password} = req.body

if(!(username || email)){
    throw new ApiError(400,"username or email must be required")
}
const user = await User.findOne({
    $or:[{username},{email}]
})
if(!user){
   throw new ApiError(404,"User not found")
}

const isPasswordValid = await user.isPasswordCorrect(password)
if(!isPasswordValid){
   throw new ApiError(401,"Invalid credentials")
}

const {accessToken,refreashToken} = await generateAccessAndRefreshToken(user._id)

const loggedInuUser =  await User.findById(user._id).select("-password -refreshToken")

const options = {
   httpOnly:true,
   secure:true
}

return res
.status(200)
.cookie("accessToken", accessToken,options)
.cookie("refreshToken",refreashToken,options)
.json(
   new ApiResponse(
      200,
      {
         user:loggedInuUser,refreashToken,accessToken
      },
      "user loggedIn successfully"
   )
)

})


const  logoutUser = asyncHandler(async(req,res)=>{
   
   if(!req.user || !req.user._id){
      throw new ApiError(401,"User not authenticated")
   }

   await User.findByIdAndUpdate(
      req.user._id,
      {
         $unset:{
            refreshToken:1
         }
      },
      {
         new:true
      }
   )
   const options = {
      httpOnly:true,
      secure:true
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200,{},"User logged Out"))

})

const refreshAccessToken = asyncHandler(async(req,res)=>{
 try {
    const incomingRefreshToken = req.cookies.refreashToken || req.body.refreashToken
  if(!incomingRefreshToken){
     throw new ApiError(401,"unauthorized request")
  }
  const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
  const user = await User.findById(decodedToken?._id)
  
  if(!user){
     throw new ApiError(401, "Invalid refresh token")
  }
  
  if(incomingRefreshToken !==user?.refreshToken){
     throw new ApiError(401,"refresh token is expired or used")
  }
  
  const options = {
     httpOnly:true,
     secure:true
  }
  
   const {accessToken,newRefreshToken}=   await generateAccessAndRefreshToken(user._id)
  
  return res
  .status(200)
  .cookie("accessToken",accessToken,options)   
  .cookie("refreshToken",newRefreshToken,options)
  .json(
     new ApiResponse(
        200,
        {
           accessToken, newRefreshToken
        },
        "Access token refreshed successfully"
     ))
 } catch (error) {
   throw new ApiError(401,error?.message || "invalid refresh token")
 }

})

 
const changeCurrentPassword = asyncHandler(async(req,res)=>{
   const {oldPassword,newPassword}= req.body;

   const user = await User.findById(req.user?._id)

   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

   if(!isPasswordCorrect){
      throw new ApiError(400,"old password is incorrect")

   }
   user.password = newPassword;
   await user.save({validateBeforeSave: false})

   return res
   .status(200)
   .json( new ApiResponse(200,{},"password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})
const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})



export {
   loginUser,
   logoutUser,
   refreshAccessToken,
   registerUser,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage
}