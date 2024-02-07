import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import  jwt  from "jsonwebtoken";


const generateAccessAndRefreshToken = async (id) => {
    try {
        const user = User.findById(id);
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({validateBeforeSave : false});

        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Error while generating authentication toekns");
    }
}

const registerUser = asyncHandler(async (req, res, next) => {
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
    const coverImageLocalPath = req.files?.coverImage ? coverImage[0].path : null;

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
    .status(201).json(
        new ApiResponse(200, "User is Created Successfully.", createdUser)
    );

});

const loginUser = asyncHandler( async (req, res, next) => {
    // de-structure the data from req body
    // validate the data 
    // find the user either by email of username
    // throw error if user is not present
    // check the pw if is valid
    // if valid generate the access and refresh token
    // store the refresh token in db , save and again fetch the user
    // put the access and refresh token in cookies
    // then sent the user info back.

    const {username, email, password} = req.body;

    if(!username && !email ) {
        throw new ApiError(400, "Username or email is required");
    }

    const user = User.findOne({
        $or: [{username}, {email}]
    });

    if(!user) throw new ApiError(400, "User doesn't exist");

    const isPasswordCorrect = user.isPasswordCorrect(password);

    if(!isPasswordCorrect) {
        throw ApiError(400, "Password is incorrect!!");
    }

    const {accessToken, refreshToken} = generateAccessAndRefreshToken(user._id);

    const loginUser = User.findById(user._id).select(" -password -refreshToken ");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, "User Successfully Logged in", {loginUser, refreshToken, accessToken})
    );

});

const logoutUser = asyncHandler( async (req, res, next) => {
    await User.findByIdAndUpdate(
        req?.user?._id, 
        {
            $unset: {
                refreshToken : 1
            }
        },
        {
            new: true
        }
    );
    
    const options = {
        httpOnly: true,
        secure: true
    };


    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, "User Successfully Logged out!", {})
    );
});


const refreshAccessToken = asyncHandler( async() => {
    // extract the refresh token from cookies
    // check if you got it
    // verify the token and extract its values
    // find the user by id
    // if user exists generate access and refresh tokens
    // send them in cookies

    const cookieRefreshToken = req.cookies?.refreshToken;

    if(!cookieRefreshToken) {
        throw new ApiError(401, "No Access Token");
    }

    try {
        const decodedToken = jwt.verify(cookieRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken._id);
    
        if(!user) {
            throw new ApiError(401, "Refresh Token is not valid");
        }
    
        const {accessToken, refreshToken} = generateAccessAndRefreshToken(user._id);
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        return res
        .status(200)
        .cookie("refreshToken", refreshToken)
        .cookie("accessToken", accessToken)
        .json(
            new ApiResponse(200, "Tokens are generated", {accessToken, refreshToken})
        );
    } catch (error) {
        throw new ApiError(401, error.message || "Invalid Access Token");
    }
})

export { registerUser, loginUser, logoutUser, refreshAccessToken };
