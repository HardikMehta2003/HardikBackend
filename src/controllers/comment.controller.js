import mongoose from "mongoose"
import {Comment} from "../models/comments.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const comment =await Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId),
            }
        },
        {
            $project:{
                content:1,
                _id:0
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"All Comments Fetched Successfully")
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body

    const video = await Video.findById(videoId);
    const owner = await User.findById(req.user._id);

    if(content?.trim()===""){
        new ApiError(400,"Content is required");
    }

    const comment = await Comment.create({
        content,
        video:video._id,
        owner:owner._id
    })

    const commentCreated = await Comment.findById(comment._id);

    if(!commentCreated){
        throw new ApiError(500,"Something went Wrong while Commenting");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,commentCreated,"Comment Successful")
    )

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const {content} = req.body



    const comment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content:content,
            }
        },
        {
            new:true,
        }
    );


    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"Comment Updated sucessfully")
    )


})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params;

    const deleteComment = await Comment.findByIdAndDelete(commentId);

    return res
    .status(200)
    .json(
        new ApiResponse(200,deleteComment,"Comment deleted succesfully")
    )

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }