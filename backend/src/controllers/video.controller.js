import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import fs from "fs"
import { title } from "process"


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

    const { title, description, isPublic} = req.body;

    
    const videoLocalPath = req.files?.videoFile ? req.files?.videoFile[0].path : null;
    const thumbnailLocalPath = req.files?.thumbnail ? req.files?.thumbnail[0].path : null;
    
    if([title, description].some((val) => val == null || val == undefined || val.trim() === "")) {
        if(videoLocalPath) fs.unlinkSync(videoLocalPath);
        if(thumbnailLocalPath) fs.unlinkSync(thumbnailLocalPath);
        throw new ApiError(400, "Title and Description is Required.");
    }
    
    if(!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Both Video and Thumbnail are required");
    }
    
    const videoOnCloudinary = await uploadOnCloudinary(videoLocalPath);
    const thumbnailOnCloudinary = await uploadOnCloudinary(thumbnailLocalPath);
    
    if(!videoOnCloudinary || !thumbnailOnCloudinary) {
        throw new ApiError(400, "Both Video and Thumbnail are required");
    }

    const video = await Video.create({
        title,
        description,
        duration : (videoOnCloudinary.duration).toFixed(2),
        videoFile: videoOnCloudinary.url,
        thumbnail: thumbnailOnCloudinary.url,
        isPublic: isPublic === "false" ? false : true,
        owner: req.user._id
    })
    

    return res
    .status(201)
    .json(new ApiResponse(200, "Video is uploaded", {
        video
    }));
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id

    const video = await Video.findById(videoId);

    if(!video) {
        throw new ApiError(400, "Video does not Exist.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Fetched Video Successfully.", video)
    );
});

const updateVideo = asyncHandler(async (req, res) => {
    // TODO: update video details like title, description, thumbnail
    // Destructure the information like title, description and thumbnail from the req body
    const { videoId } = req.params
    const {title, description} = req.body;
    const thumbnailLocalPath = req.file?.thumbnail || null;

    let updateObject = {};
    if (title !== undefined) {
        updateObject.title = title;
    }
    if (description !== undefined) {
        updateObject.description = description;
    }
    if (thumbnailLocalPath !== undefined) {
        updateObject.thumbnailLocalPath = thumbnailLocalPath;
    }

    if(updateObject.length <= 0) {
        throw new ApiError(400, " There is nothing to update.");
    }

    const video = await Video.findByIdAndUpdate(videoId, updateObject, {new : true});

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Video Successfully Updated.", video)
    );
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    // Find the video form db.
    // delete video and thumbnail files from cloudinary
    // then delete entry as well

    const video = await Video.findByIdAndDelete(videoId, {new: true});

    await deleteFromCloudinary(video.videoFile);
    await deleteFromCloudinary(video.thumbnail);

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Video deleted Successfully.")
    );
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = Video.findById(videoId);

    video.isPublic = !video.isPublic

    video.save({ validateBeforeSave : false });

    return res
    .status(200)
    .json(
        new ApiResponse(200, video.isPublic ? "Video is public now" : "Video i private now")
    );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}