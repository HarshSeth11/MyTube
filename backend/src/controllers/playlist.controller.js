import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    if([name, description].some((val) => val === null || val.trim() === "")) {
        throw new ApiError(400, "Both name and description is required.");
    }

    if(!isValidObjectId(user.body._id)) {
        throw new ApiError(401, "You are not authorized to create a playlist.");
    }

    const playlist = await Playlist.create({name, description, owner: req.user._id});

    if(!playlist) {
        throw new ApiError(500, "Error while creating playlist.");
    }

    return res
    .status(400)
    .json(
        new ApiResponse(200, "Playlist is created", playlist)
    );
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!isValidObjectId(userId)) {
        throw new ApiError(401, "There are no Playlists available");
    }

    // sending the information of first video along
    const userPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: userId
            }
        }, 
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "firstVideoInfo"
            },
            pipeline: [
                {
                    $limit: 1
                }
            ]
        },
        {
            $project: {
                name: 1,
                description: 1,
                firstVideoInfo: 1,
                owner: 1
            }
        }
    ])

    if(!userPlaylists) {
        throw new ApiError(400, "There are no Playlists available")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Playlists are fetched successfully", userPlaylists)
    );
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: playlistId
            }
        }, 
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1,
                owner: 1
            }
        }
    ])

    if(!playlist) {
        throw new ApiError(400, "This Playlist exist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Playlist fetched successfully", playlist)
    );
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId) {
        throw new ApiError(400, "Both playlist and video Id is required.")
    }

    const updatedPlaylist = await Playlist.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $set: {
                "videos" : {
                    $concatArrays: ["$videos", mongoose.Types.ObjectId(videoId)]
                }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                createdAt: 1,
                updatedAt: 1
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1,
                owner: 1
            }
        }
    ]);

    if(!updatedPlaylist) {
        throw new ApiError(500, "Some problem while adding video in the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Video is successfully added to the playlist", updatedPlaylist)
    );
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    const updatedPlaylist = await Playlist.aggregate([
        {
            $match: {
                _id: mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $set: {
                videos: {
                    $filter: {
                        input: "$videos",
                        name: "video",
                        cond: {
                            $ne: ["$$video", mongoose.Types.ObjectId(videoId)]
                        }
                    }
                }
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                videos: 1,
                owner: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ]);

    if(!updatedPlaylist) {
        throw new ApiError(500, "Some problem while removing video from the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Video is successfully Removed from the playlist", updatedPlaylist)
    );
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
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