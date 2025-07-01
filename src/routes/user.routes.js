import { Router } from "express";
import { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateCoverImage, 
    getUserChannelProfile, 
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
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/changePassword").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account-details").patch(verifyJWT,updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar)
router.route("/update-coverimage").patch(verifyJWT,upload.single("coverImage"),updateCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)

export default router;