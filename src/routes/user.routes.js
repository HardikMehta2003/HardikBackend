import { Router } from "express";
import { 
    registerUser,
    // loginUser,
    // logoutUser,
    // refreshAccessToken, 
    // changeCurrentPassword, 
    // getCurrentUser, 
    // updateAccountDetails, 
    // updateUserAvatar, 
    // updateCoverImage, 
    // getUserChannelProfile, 
    // getWatchHistory 
} 
    from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middeleware.js";
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
);
export default router;