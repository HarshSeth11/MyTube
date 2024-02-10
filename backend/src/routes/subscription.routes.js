import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js"

const router = Router();

router.use(verifyJWT);

router
.route("/channel/:channelId")
.get(getSubscribedChannels)
.post(toggleSubscription)

router.get('/channel/:channelId', getUserChannelSubscribers);


export default router;