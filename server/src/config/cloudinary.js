import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

export const deleteFromCloudinary = async (public_id) => {
    if (!public_id) return false;
    try {
        const result = await cloudinary.uploader.destroy(public_id);
        return result?.result === 'ok';
    } catch (e) {
        console.error("Cloudinary Deletion Error:", e);
        return false;
    }
};

export default cloudinary;
