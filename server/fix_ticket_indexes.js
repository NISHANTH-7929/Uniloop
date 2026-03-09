
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Ticket from './src/models/Ticket.js';

import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

dotenv.config();

const fixIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const collection = Ticket.collection;
        const indexes = await collection.indexes();
        console.log('Current Indexes:', JSON.stringify(indexes, null, 2));

        const hasUniqueIndex = indexes.find(idx => idx.name === 'user_1_event_1' && idx.unique);

        if (hasUniqueIndex) {
            console.log('Dropping unique index user_1_event_1...');
            await collection.dropIndex('user_1_event_1');
            console.log('Index dropped successfully.');

            console.log('Creating non-unique index user_1_event_1...');
            await collection.createIndex({ user: 1, event: 1 });
            console.log('Index created successfully.');
        } else {
            console.log('No unique index found on user_1_event_1.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixIndexes();
