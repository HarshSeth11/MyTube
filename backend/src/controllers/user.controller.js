import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (id) => {
    try {
        const user = User.findById(id);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error while generating authentication toekns");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    // get the data from frontend.
    const { username, email, fullname, password } = req.body;

    // validate data, check if any field is empty
    if (
        [username, email, fullname, password].some(
            (item) => item == undefined || item == null || item?.trim() === ""
        )
    ) {
        throw new ApiError(400, "All Fields are required/");
    }

    // check if user with same credentials already exists, mainly check for username and email
    const userAlreadyExist = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (userAlreadyExist) {
        throw new ApiError(409, "User already exists with these credentials.");
    }

    // console.log("From here the request files starts : \n",req.files?.avatar[0].path);
    const avatarLocalPath = req.files?.avatar[0].path;
    const coverImageLocalPath = req.files?.coverImage
        ? coverImage[0].path
        : null;

    console.log("Ran smoothly", avatarLocalPath);

    // check if avatar exists
    if (!avatarLocalPath) throw new ApiError(400, "Avatar is Required");

    // Upload avatar and coverImage, if exists, on cloudinary.
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    console.log(avatar);

    // again check if avatar exists.
    if (!avatar) throw new ApiError(400, "Avatar is Required");

    // if everything is file create user
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
    });

    const createdUser = await User.findById(user._id).select(
        " -password -refreshToken "
    );

    // See if user is created in the DB
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong at the server end.");
    }

    // send the response back to user
    return res
        .status(201)
        .json(
            new ApiResponse(200, "User is Created Successfully.", createdUser)
        );
});

const loginUser = asyncHandler(async (req, res) => {
    // de-structure the data from req body
    // validate the data
    // find the user either by email of username
    // throw error if user is not present
    // check the pw if is valid
    // if valid generate the access and refresh token
    // store the refresh token in db , save and again fetch the user
    // put the access and refresh token in cookies
    // then sent the user info back.

    const { username, email, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = User.findOne({
        $or: [{ username }, { email }],
    });

    if (!user) throw new ApiError(400, "User doesn't exist");

    const isPasswordCorrect = user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
        throw ApiError(400, "Password is incorrect!!");
    }

    const { accessToken, refreshToken } = generateAccessAndRefreshToken(
        user._id
    );

    const loginUser = User.findById(user._id).select(
        " -password -refreshToken "
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, "User Successfully Logged in", {
                loginUser,
                refreshToken,
                accessToken,
            })
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req?.user?._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, "User Successfully Logged out!", {}));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    // extract the refresh token from cookies
    // check if you got it
    // verify the token and extract its values
    // find the user by id
    // if user exists generate access and refresh tokens
    // send them in cookies

    const cookieRefreshToken = req.cookies?.refreshToken;

    if (!cookieRefreshToken) {
        throw new ApiError(401, "No Access Token");
    }

    try {
        const decodedToken = jwt.verify(
            cookieRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken._id);

        if (!user) {
            throw new ApiError(401, "Refresh Token is not valid");
        }

        const { accessToken, refreshToken } = generateAccessAndRefreshToken(
            user._id
        );

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("refreshToken", refreshToken)
            .cookie("accessToken", accessToken)
            .json(
                new ApiResponse(200, "Tokens are generated", {
                    accessToken,
                    refreshToken,
                })
            );
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid Access Token");
    }
});

const changePassword = asyncHandler(async (req, res) => {
    // de-structure the old and new passwrod from the req.body
    // get the user from req.user that is attached by auth middlerware using access token
    // verify if the oldPassword is true
    // if true set the password to new password and save user
    // send response to the user

    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect)
        throw new ApiError(400, "Old Password is incorrect");

    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, "Password Changed Successfully", {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    // auth middleware has attached user in req just send it

    return res
        .status(200)
        .json(new ApiResponse(200, "User Fetched Successfully", req.body));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    // extact the info that needs to be changed
    // validate the info
    // get the user and update info
    // send the user info in res

    const { username, fullname, email } = req.body;

    const user = User.findById(req.user._id);

    if (username) {
        if (username == user.username)
            throw new ApiError(400, "This is same as previous username");

        const userAlreadyExist = await User.find({ username });

        if (userAlreadyExist)
            throw new ApiError(400, "This username is not available");

        user.username = username;
    }

    if (email) {
        if (email == user.email)
            throw new ApiError(400, "This is same as previous username");

        const userAlreadyExist = await User.find({ email });

        if (userAlreadyExist)
            throw new ApiError(400, "This email already exists");

        user.email = email;
    }

    if (fullname) user.fullname = fullname;

    const updatedUser = await user
        .save({ validateBeforeSave: false })
        .select(" -password -refreshToken ");

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Information is updated Successfully",
                updatedUser
            )
        );
});

const updateAvatar = asyncHandler(async (req, res) => {
    // get the local file path of avatar
    // upload it on cloudinary
    // set and save the url into the db

    const avatarLocalPath = req?.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url,
            },
        },
        {
            new: true,
        }
    ).select(" -password -refreshToken ");

    return res
        .status(200)
        .json(new ApiResponse(200, "Avatar is updated successfully", user));
});

const updateCoverImage = asyncHandler(async (req, res) => {
    // get the local file path of CoverImage
    // upload it on cloudinary
    // set and save the url into the db

    const CoverImageLocalPath = req?.file?.path;

    if (!CoverImageLocalPath) {
        throw new ApiError(400, "CoverImage is required");
    }

    const CoverImage = await uploadOnCloudinary(CoverImageLocalPath);

    const user = User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                CoverImage: CoverImage.url,
            },
        },
        {
            new: true,
        }
    ).select(" -password -refreshToken ");

    return res
        .status(200)
        .json(new ApiResponse(200, "CoverImage is updated successfully", user));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const username = req.params;

    if (!username) {
        throw new ApiError(400, "Username is required.");
    }

    const channel = await User.aggregate([
        {
            $match: { username },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                _id: 0,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            },
        },
    ]);

    if (!channel.length) {
        throw new ApiError(404, "Channel Doesn't Exists");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "User channel Fetched Successfully.",
                channel[0]
            )
        );
});

const getWatchHistory = asyncHandler(async () => {
    const user = await User.aggregate([
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                "Watched History Fetched Successfully",
                user[0].watchHistory
            )
        );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory
};
