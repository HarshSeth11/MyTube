import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
    getLikedVideos,
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/:videoId", toggleVideoLike);
router.post("/:commentId", toggleCommentLike);
router.post("/:tweetId", toggleTweetLike);
router.post("/videos", getLikedVideos);

export default router;
