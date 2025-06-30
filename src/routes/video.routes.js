import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middeleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            // {
            //     name: "thumbnail",
            //     maxCount: 1,
            // },
            
        ]),
        publishAVideo
    )
    // .patch(updateVideo)

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(updateVideo);

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default router