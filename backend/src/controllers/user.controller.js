import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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
    res.status(201).json(
        new ApiResponse(200, "User is Created Successfully.", createdUser)
    );

    res.end();
});

export { registerUser };
