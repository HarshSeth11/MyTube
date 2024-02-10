import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateAccountDetails, updateAvatar, updateCoverImage, getWatchHistory, getUserChannelProfile } from "../controllers/user.controller.js"
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

router.post('/change-password', verifyJWT, changePassword);

router.post('current-user', verifyJWT, getCurrentUser);

router.patch('/update-account', verifyJWT, updateAccountDetails);

router.patch('/avatar', verifyJWT, upload.single("avatar") ,updateAvatar);

router.patch('/cover-image', verifyJWT, upload.single("coverImage") ,updateCoverImage);

router.get('/channel/:username', verifyJWT, getUserChannelProfile);

router.get('watch-history', verifyJWT, getWatchHistory);

export default router 