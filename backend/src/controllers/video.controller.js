import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const videos = await Video.aggregate([
        {
            $sort : {
                [sortBy] : sortType === 'desc' ? -1 : 1
            }
        },
        {
            $skip: (page-1) * limit
        },
        {
            $limit: parseInt(limit)
        }
    ]);

    if(!videos) {
        throw new ApiError(500, "Something went wrong while fetching videos");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Videos Fetched Successfully", videos)
    );
})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    // destructure title and description from req body
    // get video file and thumbnail from req.files
    // if we have both upload on cloudinary
    // get the details of the video, like duration to store in db
    // save it in db and return the response to the user.

    const { title, description} = req.body;

    const videoLocalPath = req.files?.videoFile[0].path;
    const thumbnailLocalPath = req.files?.thumbnail[0].path;

    if(!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Both Video and Thumbnail are required");
    }
    
    const video = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    
    if(!video || !thumbnail) {
        throw new ApiError(400, "Both Video and Thumbnail are required");
    }

    console.log(video);

    res.send(video, thumbnail);
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}