import { v2 as cloudinary} from 'cloudinary';
import fs from 'fs'

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Configure cloudinary inside the function to ensure env vars are loaded
        cloudinary.config({ 
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
          api_key: process.env.CLOUDINARY_API_KEY, 
          api_secret: process.env.CLOUDINARY_API_SECRET
        });
        
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });
        
        // Remove file from local storage after successful upload
        fs.unlinkSync(localFilePath);
        
        console.log("File is uploaded on cloudinary", response.url);
        return response;
    } catch (err) {
        console.error("Cloudinary upload error:", err);
        // Remove file from local storage if upload failed
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
}

export { uploadOnCloudinary }