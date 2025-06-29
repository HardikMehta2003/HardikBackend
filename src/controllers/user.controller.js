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

export {
    registerUser,
    loginUser,
    refreshAccessToken,
    changeCurrentPassword,
    logoutUser
}