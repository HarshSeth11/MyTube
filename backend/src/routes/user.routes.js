import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateAccountDetails, updateAvatar, updateCoverImage } from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();


router.post('/register', 
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ])
    , registerUser);


router.post('/login', loginUser);

router.post('/logout', verifyJWT, logoutUser);

router.post('/refresh-token', refreshAccessToken);

router.post('./change-password', verifyJWT, changePassword);

router.post('current-user', verifyJWT, getCurrentUser);

router.post('./update-account', verifyJWT, updateAccountDetails);

router.post('./avatar', verifyJWT, updateAvatar);

router.post('./cover-image', verifyJWT, updateCoverImage);

export default router 