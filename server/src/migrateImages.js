import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

// Models
import LostFoundItem from './models/LostFoundItem.js';
import Listing from './models/Listing.js';
import QAPost from './models/QAPost.js';
import Notice from './models/Notice.js';
import Complaint from './models/Complaint.js';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

const isBase64 = (str) => {
    return str && typeof str === 'string' && str.startsWith('data:image/');
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

const uploadBase64WithRetry = async (base64String, folderName, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await cloudinary.uploader.upload(base64String, {
                folder: `uniloop/${folderName}`,
                transformation: [{ width: 1000, crop: "limit", quality: "auto", fetch_format: "auto" }]
            });
            return { url: result.secure_url, publicId: result.public_id };
        } catch (error) {
            console.warn(`[!] Upload failed (Attempt ${attempt}/${maxRetries}) in ${folderName}: ${error.message}`);
            if (attempt === maxRetries) {
                console.error(`[X] Exhausted all retries for ${folderName} image.`);
                return null;
            }
            await delay(1000 * attempt); // Exponential backoff lightly
        }
    }
};

const migrateCollection = async (Model, fieldName, isArray = false, modelName) => {
    console.log(`\n--- Migrating ${modelName} ---`);
    let stats = { total: 0, updated: 0, skipped: 0, failed: 0 };
    
    // Find all documents
    const docs = await Model.find({});
    stats.total = docs.length;

    for (const doc of docs) {
        let changed = false;

        if (isArray) {
            const items = doc[fieldName];
            if (items && Array.isArray(items)) {
                let publicIdsArray = doc.imagePublicIds || [];
                for (let i = 0; i < items.length; i++) {
                    if (isBase64(items[i])) {
                        console.log(`[>>] Uploading base64 image from ${modelName} ID: ${doc._id}...`);
                        const result = await uploadBase64WithRetry(items[i], modelName.toLowerCase());
                        if (result) {
                            items[i] = result.url;
                            publicIdsArray[i] = result.publicId;
                            changed = true;
                        } else {
                            stats.failed++;
                        }
                    } else {
                        // Not base64 (already migrated, or skipped placeholder)
                    }
                }
                if (changed) {
                    doc[fieldName] = items;
                    doc.imagePublicIds = publicIdsArray;
                }
            }
        } else {
            // Single string field
            const value = doc[fieldName];
            
            // Check idempotency: does it already have a public_id or is it definitely not base64?
            if (isBase64(value)) {
                console.log(`[>>] Uploading base64 image from ${modelName} ID: ${doc._id}...`);
                const result = await uploadBase64WithRetry(value, modelName.toLowerCase());
                if (result) {
                    doc[fieldName] = result.url;
                    doc.imagePublicId = result.publicId;
                    changed = true;
                } else {
                    stats.failed++;
                }
            } else {
                // If it's not base64 and not missing, we skip.
            }
        }

        // Need to check nested answers for QAPost independently
        if (modelName === 'QAPosts' && doc.answers && doc.answers.length > 0) {
            for (const answer of doc.answers) {
                if (isBase64(answer.imageUrl)) {
                     console.log(`[>>] Uploading nested answer image from QAPost ID: ${doc._id}...`);
                     const result = await uploadBase64WithRetry(answer.imageUrl, 'qa_answers');
                     if (result) {
                         answer.imageUrl = result.url;
                         answer.imagePublicId = result.publicId;
                         changed = true;
                     } else {
                         stats.failed++;
                     }
                }
            }
        }

        // Need to check nested foundReports for LostFoundItem
        if (modelName === 'LostFoundItems' && doc.foundReports && doc.foundReports.length > 0) {
             for (const report of doc.foundReports) {
                 if (isBase64(report.imageUrl)) {
                     console.log(`[>>] Uploading nested report image from LostFoundItem ID: ${doc._id}...`);
                     const result = await uploadBase64WithRetry(report.imageUrl, 'lf_reports');
                     if (result) {
                         report.imageUrl = result.url;
                         report.imagePublicId = result.publicId;
                         changed = true;
                     } else {
                         stats.failed++;
                     }
                 }
             }
        }

        if (changed) {
            await doc.save();
            stats.updated++;
            console.log(`[OK] Updated ${modelName} ID: ${doc._id}`);
        } else {
            stats.skipped++;
        }
    }
    
    console.log(`\n============================`);
    console.log(`Summary for ${modelName}:`);
    console.log(`Total:   ${stats.total}`);
    console.log(`Updated: \x1b[32m${stats.updated}\x1b[0m`);
    console.log(`Skipped: ${stats.skipped}`);
    console.log(`Failed:  \x1b[31m${stats.failed}\x1b[0m`);
    console.log(`============================\n`);
};

const runMigration = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- Connected to MongoDB ---');

        await migrateCollection(LostFoundItem, 'imageUrl', false, 'LostFoundItems');
        await migrateCollection(Notice, 'imageUrl', false, 'Notices');
        await migrateCollection(Complaint, 'imageUrl', false, 'Complaints');
        await migrateCollection(QAPost, 'imageUrl', false, 'QAPosts');
        await migrateCollection(Listing, 'images', true, 'Listings');

        console.log('\n✅ Enterprise Migration fully completed!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed critically:', error);
        process.exit(1);
    }
};

runMigration();
