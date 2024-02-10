import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/", createPlaylist);

router
    .route("/:playlist")
    .get(getPlaylistById)
    .patch(updatePlaylist)
    .delete(deletePlaylist);

router.patch("/add/:videoId/:playlistId", addVideoToPlaylist);

router.patch("/remove/:videoId/:playlistId", removeVideoFromPlaylist);

router.get("/:userId", getUserPlaylists);


export default router;
