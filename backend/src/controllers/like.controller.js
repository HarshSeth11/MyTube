import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    // check if the user have already liked the video
    // if yes delete that entry from like collection
    // Otherwise add it in like collection

    const like = await Like.findOneAndDelete({likeBy: req.user._id, video: videoId});

    if(!like) {
        await Like.create({
            video: videoId,
            likeBy: req.user._id
        });
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, like? "Like is removed" : "Liked is Added")
    );
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    const like = await Like.findOneAndDelete({likeBy: req.user._id, comment: commentId});

    if(!like) {
        await Like.create({
            comment: commentId,
            likeBy: req.user._id
        });
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, like? "Like is removed" : "Liked is Added")
    );
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet

    const like = await Like.findOneAndDelete({likeBy: req.user._id, tweet: tweetId});

    if(!like) {
        await Like.create({
            tweet: tweetId,
            likeBy: req.user._id
        });
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, like? "Like is removed" : "Liked is Added")
    );
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const allLikedVideos = await Like.aggregate([
        {
            $match: {
                likeBy: req.user._id
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideos"
            }
        },
        {
            $project: {
                likedVideos: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(200, allLikedVideos.length > 0 ? "All liked videos are fetched successfully" : "You haven't liked any video so far", allLikedVideos.length > 0 ? allLikedVideos : null )
    );
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}