import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist

    if(
        [name,description].some((field)=>
            field?.trim()==="")){
                throw new ApiError(400,"All Fields are required");
            };

    
    const plist =await Playlist.findOne({
        $or:[{name},{description}]
    })

    if(plist){
        throw new ApiError(409,"Playlist Already exist");
    }

    const owner = await User.findById(req.user._id);

    const playlist = await Playlist.create({
        name,
        description,
        videos:[],
        owner:owner
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"PLaylist created successfully")
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    const playList = await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project:{
                _id:0,
                name:1,
                description:1,
                videos:1
            }
        },
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,playList,"Play List Fetched Succesfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    const playlist = await Playlist.findById(playlistId);

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Play List Fetched Succesfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    const video = await Video.findById(videoId);
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{
                videos:video
            }
        }
    )


    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Video added to PlayList Successfully")
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    const video = videoId;
    console.log(video);
    const playlist = await Playlist.updateOne(
        {
            _id:new mongoose.Types.ObjectId(playlistId)
        },
        {
            $pull:{
                'videos': video
            }
        }
    )


    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"Video Deleted Sucessfully")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    const toDeletePlayList = await Playlist.findByIdAndDelete(playlistId);

    return res
    .status(200)
    .json(
        new ApiResponse(200,toDeletePlayList,"Playlist deleted succesfully")
    )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name:name,
                description:description
            }
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,playlist,"PlayList Updated successfully")
    )

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}