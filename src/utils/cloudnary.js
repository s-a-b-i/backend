import { v2 as cloudinary } from "cloudinary";

import fs from "fs";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View Credentials' below to copy your API secret
});


const upLoadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });

        console.log("File uploaded successfully", response.url);
        return response;
    
    } catch (error) {
        console.error("Error uploading file:", error);
        fs.unlinkSync(localFilePath); // remove the uploaded file from server
        return null;
    }
};


// cloudinary.v2.uploader.upload(
//     "https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
//     { public_id: "sample" },
//     function (error, result) {
//         console.log(result, error);
//     })



export { upLoadOnCloudinary };   