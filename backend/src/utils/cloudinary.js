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


// Function to delete a file from Cloudinary using its URL
async function deleteFromCloudinary(fileUrl) {
    try {
      // Search for the file using its URL
      const searchResult = await cloudinary.search
        .expression(`url:${fileUrl}`)
        .execute();
      
      // Extract the public ID from the search result
      const publicId = searchResult.resources[0].public_id;
  
      // Delete the file using the public ID
      const result = await cloudinary.uploader.destroy(publicId);
      console.log('File deleted successfully:', result);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

export {uploadOnCloudinary, deleteFromCloudinary};