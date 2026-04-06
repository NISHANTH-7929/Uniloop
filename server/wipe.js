import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/uniloop_backend")
  .then(async () => {
    try {
      const Order = (await import('./src/models/Order.js')).default;
      const res = await Order.deleteMany({});
      console.log(`Deleted ${res.deletedCount} orders`);
      process.exit(0);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
