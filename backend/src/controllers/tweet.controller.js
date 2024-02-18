import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body;

    if(content.trim() === "") {
        throw new ApiError(400, "Content is required");
    }

    const tweet = await Tweet.create({
        content,
        owner: mongoose.Types.ObjectId(req.user._id)
    });

    return res
    .status(201)
    .json(
        new ApiResponse(200, "Tweet is created", tweet)
    );
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    
    const tweets = await Tweet.find({owner: mongoose.Types.ObjectId(req.user._id)});

    if(tweets.length === 0) {
        throw new ApiError(404, "No tweet found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "All Tweets are fetched successfully", tweets)
    );
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params;
    const { content } = req.body;
    
    const updatedTweet = await Tweet.findByIdAndUpdate(mongoose.Types.ObjectId(tweetId), {
        content
    }, {new : true});

    if(!updatedTweet) {
        throw new ApiError(404, "Tweet not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Tweet updated Successfully", updateTweet)
    );
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params;

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if(!deletedTweet) {
        throw new ApiError(404, "Tweet not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Tweet Deleted Successfully")
    );
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}