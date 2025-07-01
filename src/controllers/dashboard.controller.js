import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscriptions.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    const stats = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from : "videos",
                localField : "_id",
                foreignField : "owner",
                as : "Allvideos",
            }
        },
        {
            $lookup:{
                from : "likes",
                localField : "_id",
                foreignField : "owner",
                as : "AllLikes", 
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
            $addFields : {
                TotalVideos:{
                    $size: "$Allvideos"
                },
                TotalLikes:{
                     $size: "$AllLikes"
                },
                TotalSubscriber:{
                     $size: "$subscribers"
                }
            }
        },
        {
            $project:{
                fullName: 1,
                username: 1,
                TotalLikes:1,
                TotalSubscriber:1,
                TotalVideos:1,
                Totalviews:{$sum:"$Allvideos.views"}
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, stats,"User channel Stats fetched succesfully")
    )

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const videos = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from : "videos",
                localField : "_id",
                foreignField : "owner",
                as : "Allvideos",
            }
        },
        {
            $project:{
                _id:1,
                title:1,
                videoFile:1,
            }
        }
    ])


    return res
    .status(200)
    .json(
        new ApiResponse(200,videos,"All Videos fetched Succesfully")
    )


})

export {
    getChannelStats, 
    getChannelVideos
    }