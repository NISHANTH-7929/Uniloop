
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const checkAndCreateIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Check and create Event indexes
        const eventCollection = mongoose.connection.collection('events');
        console.log('\n=== Event Collection Indexes ===');

        const currentEventIndexes = await eventCollection.indexes();
        console.log('Current indexes:', currentEventIndexes.map(idx => idx.name));

        // Define required indexes
        const requiredIndexes = [
            { key: { date: 1 }, name: 'date_1' },
            { key: { status: 1 }, name: 'status_1' },
            { key: { organizer: 1 }, name: 'organizer_1' },
            { key: { 'subevents.date': 1 }, name: 'subevents.date_1' },
            { key: { createdAt: -1 }, name: 'createdAt_-1' }
        ];

        for (const indexDef of requiredIndexes) {
            const exists = currentEventIndexes.some(idx => idx.name === indexDef.name);
            if (!exists) {
                console.log(`Creating index: ${indexDef.name}`);
                await eventCollection.createIndex(indexDef.key, { name: indexDef.name });
            } else {
                console.log(`Index ${indexDef.name} already exists`);
            }
        }

        // Check other collections
        const collections = ['users', 'tickets', 'notifications', 'conversations'];
        for (const collName of collections) {
            try {
                const collection = mongoose.connection.collection(collName);
                const indexes = await collection.indexes();
                console.log(`\n=== ${collName.toUpperCase()} Collection ===`);
                console.log(`Found ${indexes.length} indexes:`, indexes.map(idx => idx.name));
            } catch (err) {
                console.log(`\n=== ${collName.toUpperCase()} Collection ===`);
                console.log('Error checking indexes:', err.message);
            }
        }

        console.log('\n✅ Index check completed');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

checkAndCreateIndexes();
