import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    const owner = await User.findById(req.user._id)

    const tweet =await Tweet.create({
        content,
        owner:owner
    })

    const createdTweet = await Tweet.findById(tweet._id);

    if(!createdTweet){
        throw new ApiError(500,"Something went Wrong while Creating Tweet");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,createdTweet,"Tweet Created successfully")
    )

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    const user = new mongoose.Types.ObjectId(userId)

    const tweets = await Tweet.aggregate([
        {
            $match:{
                owner:user
            }
        },
        {
            $project:{
                _id:0,
                content:1,
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,tweets,"Tweets Fetched Sucessfully")
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content} = req.body
    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content:content
            }
        },
        {
            new:true
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200,tweet,"Tweet Updated sucessfully")
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId} = req.params

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    return res
    .status(200)
    .json(
        new ApiResponse(200,deleteTweet,"Tweet Deleted sucessfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}