import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v4 as uuidv4 } from 'uuid';
import cloudinary from '../config/cloudinary.js';

// Factory function to create specialized uploaders
export const createUploader = (folderName) => {
    const storage = new CloudinaryStorage({
        cloudinary: cloudinary,
        params: {
            folder: `uniloop/${folderName}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            public_id: (req, file) => `${Date.now()}-${uuidv4()}`,
            transformation: [{ width: 1000, crop: "limit", quality: "auto", fetch_format: "auto" }]
        },
    });

    const fileFilter = (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Invalid file type. Only JPEG, PNG, and WebP are allowed."), false);
        }
    };

    return multer({
        storage: storage,
        fileFilter: fileFilter,
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB Limit per file
        },
    });
};

// Default generic middleware for backward compatibility while migrating
export default createUploader('general');
