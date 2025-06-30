import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadFileCloudinary} from "../utils/cloudinary.js"
import {getVideoDurationInSeconds} from 'get-video-duration'


const getAllVideos = asyncHandler(async (req, res) => {
    const { query,sortType, userId } = req.query
    const Query = `${query}`;
    // // const SortBy = sortBy;
    const SortType = `${sortType}`;
    // const user = User.findById(userId);
    // const _id = `${user._id}`

    // if(!SortBy){
    //     throw new ApiError(404,"Query not found");
    // }

    const videos =await Video.aggregate([
        {
            $match:{
                // from:"videos",
                // localField:_id,
                // foreignField:"owner",
                // as:"allVideos",
                owner:userId,
                pipeline:[
                    {
                        $search:{
                            "text":{
                                "path":"title",
                                "query":Query,
                            }
                        },
                    },
                    {
                        $search:{
                            "text":{
                                "path":"description",
                                "query": SortType ,
                            }
                        },
                    },
                    {
                        $sort:{views:1}
                    },
                    {
                        $project:{
                            title:1,
                            views:1
                        },
                    },
                ]
            }
        },
    ])

    if(!videos?.length){
        throw new ApiError(404,"no videos found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,videos,"Videos fetched succesfully")
    )

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if(
        [title,description].some((field)=>
            field?.trim()==="")){
                throw new ApiError(400,"All Fields are required");
            };

    const videoLocalPath = req.files?.videoFile[0]?.path;
    const videoFile = await uploadFileCloudinary(videoLocalPath);

    const owner = await User.findById(req.user._id);
    // let duration;
    // const duration  = getVideoDurationInSeconds(videoFile.url)

    const video = await Video.create({
        title,
        description,
        videoFile:videoFile.url,
        owner,
    });

    const videoCreated = await Video.findById(video._id);

    return res
    .status(200)
    .json(
        new ApiResponse(200,videoCreated,"Video Uploaded Succesfully")
    )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video =await Video.findById(videoId)


    if(!video){
        throw new ApiError(404,"Video does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video,"Video fetched succesfully")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const{title,description} = req.body

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title:title,
                description:description
            },
        },
        {
            new:true,
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video Updated Successfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video = await Video.findByIdAndDelete(videoId);

    return res
    .status(200)
    .json(
        new ApiResponse(200,video,"Video Deleted Successfully")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId);

    const status = video.isPublished;

    const ToggledVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished:!status,
            }
        },
        {
            new:true
        }
    );

    return res
    .status(200)
    .json(
        new ApiResponse(200,ToggledVideo,"Video Toggled Successfully")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}