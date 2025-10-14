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

const deleteFromCloudinary = async (publicId) => {
    try {
        if (!publicId) return null;

        // Configure cloudinary inside the function to ensure env vars are loaded
        cloudinary.config({ 
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
          api_key: process.env.CLOUDINARY_API_KEY, 
          api_secret: process.env.CLOUDINARY_API_SECRET
        });

        const response = await cloudinary.uploader.destroy(publicId);
        console.log("File deleted from cloudinary", response);
        return response;
    } catch (err) {
        console.error("Cloudinary delete error:", err);
        return null;
    }
}

const extractPublicId = (url) => {
    if (!url) return null;
    
    // Extract public ID from Cloudinary URL
    // Example: https://res.cloudinary.com/demo/image/upload/v1571218039/sample.jpg
    // Public ID would be: sample
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    
    if (uploadIndex !== -1 && uploadIndex < parts.length - 1) {
        // Skip version if present (starts with 'v' followed by numbers)
        let publicIdIndex = uploadIndex + 1;
        if (parts[publicIdIndex].startsWith('v') && /^v\d+$/.test(parts[publicIdIndex])) {
            publicIdIndex++;
        }
        
        // Get the filename without extension
        const filename = parts[publicIdIndex];
        return filename ? filename.split('.')[0] : null;
    }
    
    return null;
}

export { uploadOnCloudinary, deleteFromCloudinary, extractPublicId }