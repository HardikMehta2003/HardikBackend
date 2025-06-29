import {v2 as cloudinary} from "cloudinary";
import fs from "fs";
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_SECRET_KEY 
});


const uploadFileCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath){
            return null;
        }
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        // console.log("File Uploaded Succesfully",response.url);
        // Delete the file from the public/temp folder after uploading
        if (localFilePath.startsWith("public/temp")) {
            fs.unlinkSync(localFilePath);
        }
        return response;
        console.log(response.url);
    } catch (error) {
        fs.unlinkSync(localFilePath);
        return null;
    }
}


export {uploadFileCloudinary}