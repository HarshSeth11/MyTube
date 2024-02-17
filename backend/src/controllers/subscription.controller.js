import mongoose, {isValidObjectId, mongo} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    // find the channelId in channel and rew.user._id in subscriber, if found get the _id and delete
    // If not create one

    const subscription = await Subscription.findOne({
        channel: channelId,
        subscriber: req.body._id
    });

    if(subscription) {
        await Subscription.findByIdAndDelete(subscription._id);
    }
    else{
        await Subscription.create({
            channel: mongoose.Types.ObjectId(channelId),
            subscriber: mongoose.Types.ObjectId(req.body._id)
        });
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscription? "Channel is unsubscriber" : "Channel is Subscribed")
    );
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        {
            $project: {
                subscriber: 1
            }
        }
    ]);

    if(channelSubscribedTo.length === 0) {
        throw new ApiError(404, "No subscriber found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Subscribers are fetched Successfully", subscribers)
    );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    const channelSubscribedTo = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel"
            }
        },
        {
            $project: {
                channel: 1
            }
        }
    ]);

    if(channelSubscribedTo.length === 0) {
        throw new ApiError(404, "No Channel subscribed found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Channel Subscribed are fetched Successfully", channelSubscribedTo)
    );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}