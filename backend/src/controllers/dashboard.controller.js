import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const firstInfo = await Video.aggregate([
        {
            $match: {
                owner: req.user._id
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {
                    $add: "$views"
                },
                totalVideos: {
                    $add: 1
                }
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "videoLikes"
            }
        },
        {
            $addFields: {
                totalLikes : {
                    $size: "$videoLikes"
                }
            }
        },
        {
            $group: {
                _id: null,
                totalChannelLikes: {
                    $add: "$totalLikes"
                },
            }
        },
        {
            $project: {
                _id: 0,
                totalVideos: 1,
                totalViews: 1,
                totalChannelLikes: 1
            }
        },
    ]);

    const totalSubscribers = await Subscription.aggregate([
        {
            $match: {
                channel: req.user._id
            }
        },
        {
            $group: {
                _id: null,
                totalSubscribers: {
                    $add: 1
                }
            }
        },
        {
            $project: {
                _id: 0,
                totalSubscribers: 1
            }
        }
    ]);

    const totalChannelsSubscribedTo = await Subscription.aggregate([
        {
            $match: {
                subscriber: req.user._id
            }
        },
        {
            $group: {
                _id: null,
                totalSubscribers: {
                    $add: 1
                }
            }
        },
        {
            $project: {
                _id: 0,
                totalSubscribers: 1
            }
        }
    ]);


    console.log(firstInfo, totalChannelsSubscribedTo, totalSubscribers)

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Channel Information Fetched Successfully", {firstInfo, totalChannelsSubscribedTo, totalSubscribers})
    );
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const allChannelVideos = await Video.find({owner: req.user._id});

    if(!allChannelVideos) {
        throw new ApiError(200, "There is not video on this channel");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "All Videos are fetched Successfully", allChannelVideos)
    );
})

export {
    getChannelStats, 
    getChannelVideos
    }