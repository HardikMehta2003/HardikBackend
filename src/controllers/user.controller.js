import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadFileCloudinary } from "../utils/cloudinary.js";
import fs from 'fs';
import jwt from "jsonwebtoken";
import mongoose from "mongoose";



const generatAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        user.save({validateBeforeSave:false});

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiError(500)
    }
}

const registerUser = asyncHandler(async(req,res)=>{
     // get user details from frontend
     // validation - not empty
     // user already exist
     // check for avatar images
     // upload them to cloudinary,avatar
     // create user object-create entry in db
     // remove password and refresh token field from response
     // check for user creation
     // return response

    const {fullName,email,username,password} = req.body;
    console.log("email",email);

    // if(fullName === ""){
    //     throw new ApiError(400,"Fullname required");
    // }
    if(
        [fullName,email,username,password].some((fields)=>
            fields.trim() === ""
    )){
        throw new ApiError(400,"All Fields are Required")
    }

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    });

    if(existedUser){
        throw new ApiError(409,"User Already Existed")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar Required");
    }

    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    const avatar = await uploadFileCloudinary(avatarLocalPath);
    const coverImage = await uploadFileCloudinary(coverImageLocalPath);

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        email,
        username:username.toLowerCase(),
        password,
        coverImage:coverImage?.url || "" 
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        throw new ApiError(500,"User Creation Failed");
    }

    return res.status(201).json(
        new ApiResponse(201,createdUser,"User Created Successfully")
    );

});


const loginUser = asyncHandler(async(req,res)=>{
    // Data from frontend(postman)
    // Validate - not empty
    // generate access and refresh token
    // set refresh token in cookie
    // return response with access token and user details
    const {email, password} = req.body;

    if([email,password].some((fields)=> fields.trim() === "")){
        throw new ApiError(400,"All Fields are Required");
    }

    const user = await User.findOne({email});
    
    if(!user){
        throw new ApiError(404,"User Not Found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"invalid user credentials");
    }

    const {refreshToken,accessToken} = await generatAccessAndRefreshToken(user._id);

    const loginUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }


    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,{
            user:loginUser,accessToken,refreshToken,
        },"USER logged in succesfully")
    )
     
});

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined,
            },
        },
        {
            new:true,
        }
    )

    const options ={
        httpOnly : true,
        secure : true,
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Logged Out"))

});
 
const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"unautherized request");
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

        const user = User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Token Expired or Used");
        }
    
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} =  await generatAccessAndRefreshToken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken:newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        console.log("Error in refreshAccessToken",error);
        throw new ApiError(401,"Kuch gabad hai daya");
        
    }

});

const getCurrentUser = asyncHandler(async(req,res)=>{
    console.log(req.user)
    return res
    .status(200)
    .json(200,req.user,"Current User fetched sucessfully");
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword} = req.body;
    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw ApiError(400,"Invalid old Password");

    }

    user.password = newPassword;
    user.save({validationBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password changed Successfully"))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} = req.body;

    if(!(fullName || email)){
        throw new ApiError(400,"All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName,
                email:email
            },
        },
        {
            new:true,
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;
    const deletePreviousAvatar = avatarLocalPath;
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is missing");
    }

    const avatar = await uploadFileCloudinary(avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(400,"");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true, 
        }
    ).select("-password");

    try {
        fs.unlinkSync(deletePreviousAvatar);
      
        console.log("Delete File successfully.");
      } catch (error) {
        console.log(error);
      }
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar updated successfully"))

})

const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        throw new ApiError(400,"CoverImage file Missing file is missing");
    }

    const coverImage = await uploadFileCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        throw new ApiError(400,"");
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url,
            }
        },
        {
            new:true,
        }
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Cover Image updated successfully"))

})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400,"username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers", 
            }
        },
        {
            $lookup:{
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscripedTo",
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size: "$subscribers"
                },
                channelSubscripedToCount : {
                    $size : "$subscripedTo"
                },
                isSubcriped : {
                    $cond: {
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount:1,
                channelSubscripedToCount:1,
                isSubcriped:1,
                avater:1,
                coverImage:1,
            }
        }
    ])

    console.log(channel);

    if(!channel?.length){
        throw new ApiError(404,"channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0],"User channel fetched succesfully")
    )

})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:'owner',
                            foreignField :"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                },
                                {
                                    $addFields:{
                                        onwer:{
                                            $first:"$owner"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,user[0].watchHistory,"Watch history fetched succesfully")
    )

})

export {
    registerUser,
    loginUser,
    refreshAccessToken,
    updateUserAvatar,
    updateCoverImage,
    updateAccountDetails,
    changeCurrentPassword,
    logoutUser,
    getUserChannelProfile,
    getWatchHistory,
    getCurrentUser
}