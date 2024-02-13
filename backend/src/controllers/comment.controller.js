import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const comments = await Comment.aggregate([
        {
            $match: {
                videoId
            }
        },
        {
            $skip: (page-1) * limit
        },
        {
            $limit: limit
        }
    ]);

    res
    .status(200)
    .json(
        new ApiResponse(200, comments.length > 0? "Comments fetched successfully" : "There are not comments on this post right now", comments.length > 0? comments : {})
    );
});

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    // Destructure the content
    // get the videoId from the parameters
    const { videoId } = req.params;
    const { content } = req.body;

    if(content.trim() === "" || content === undefined || content === null) {
        throw new ApiError(400, "Content is required.")
    };

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    });

    if(!comment) {
        throw new ApiError(500, "There is some Problem while adding the comment at the server end.");
    }

    return res
    .status(201)
    .json(
        new ApiResponse(201, "Comment added Successfully", comment)
    );
});

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    // get the Comment Id from the parameters
    // get the updated content
    // check if the comment is updated by same person who added it otherwise anybody could add the comment.

    const { commentId } = req.params;
    const { content } = req.body;

    if(content.trim() === "" || content === undefined || content === null) {
        throw new ApiError(400, "Content is required.")
    };

    const newComment = await Comment.findOneAndUpdate({
        _id: commentId, 
        owner: req.user._id
    },
    {
        content
    },
    {
        new: true
    });

    if(!newComment) {
        throw new ApiError(500, "There is some Problem while Updating the comment at the server end.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Comment is updated Successfully", newComment)
    );
});

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;

    const comment = await Comment.findOneAndDelete({_id: commentId, owner: req.user._id});

    if(!comment) {
        throw new ApiError(500, "There was not comment to delete.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Comment deleted Successfully", comment)
    );
});

export { getVideoComments, addComment, updateComment, deleteComment };
