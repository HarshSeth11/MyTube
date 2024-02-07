import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler((req, res, next) => {
    try {
        // extract the accessToken from the cookies
        // verify the accessToken
        // extract the user info, mainly user id
        

        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if(!token) throw new ApiError(401, "Unauthorized Access");

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = User.findById(decodedToken?._id).select(" -password -refreshToken ");

        if(!user) throw new ApiError(401, "Invalid access Token");

        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});
