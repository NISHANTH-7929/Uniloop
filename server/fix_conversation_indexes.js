
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from 'dns';

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config();

const fixConversationIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('conversations');
        const indexes = await collection.indexes();
        console.log('Current Indexes:', JSON.stringify(indexes, null, 2));

        // Find tradeRequest_1 or any unique index on tradeRequest
        const tradeRequestIndex = indexes.find(idx => (idx.name === 'tradeRequest_1' || idx.key.tradeRequest) && idx.unique);
        const orderIndex = indexes.find(idx => (idx.name === 'order_1' || idx.key.order) && idx.unique);

        if (tradeRequestIndex) {
            console.log(`Dropping unique index ${tradeRequestIndex.name}...`);
            await collection.dropIndex(tradeRequestIndex.name);
            console.log('Index dropped.');
        }

        if (orderIndex) {
            console.log(`Dropping unique index ${orderIndex.name}...`);
            await collection.dropIndex(orderIndex.name);
            console.log('Index dropped.');
        }

        console.log('Creating non-unique sparse indexes instead (to keep performance but allow many nulls)...');
        // Actually for tradeRequest and order we don't necessarily NEED unique, but we want performance
        await collection.createIndex({ tradeRequest: 1 }, { sparse: true });
        await collection.createIndex({ order: 1 }, { sparse: true });

        console.log('All done!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

fixConversationIndexes();
