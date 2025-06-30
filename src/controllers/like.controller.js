import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { Comment } from "../models/comments.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const video = await Video.findById(videoId);
    const likedby = await User.findById(req.user._id);
    
    const like = await Like.create({
        comment:null,
        video:video._id,
        likedBy:likedby._id,
        tweet:null,
    })

    const likeCreated = await Like.findById(like._id);

    if(!likeCreated){
        throw new ApiError(500,"Something went Wrong");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,likeCreated,"Video liked Succesfully")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const comment = await Comment.findById(commentId);
    const likedby = await User.findById(req.user._id);
    
    const like = await Like.create({
        comment:comment._id,
        video:null,
        likedBy:likedby._id,
        tweet:null,
    })

    const likeCreated = await Like.findById(like._id);

    if(!likeCreated){
        throw new ApiError(500,"Something went Wrong");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,likeCreated,"Comment liked Succesfully")
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const videos = await Like.aggregate([
        {
            $match:{
                comment:null,
            }
        },
        {
            $project:{
                video:1,
                _id:0,
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,videos[0],"liked Videos Fetched Successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}