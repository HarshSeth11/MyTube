import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
    
        // As file is uploaded successfully, we have to remove temprary saved file
        fs.unlinkSync(localFilePath);
        return response; 
    } catch (error) {
        fs.unlinkSync(localFilePath);
        console.log("File Upload Fails");
        return null;
    }
}

export {uploadOnCloudinary};