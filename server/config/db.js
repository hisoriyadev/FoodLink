import mongoose from 'mongoose';

let mongoMemoryServer = null;

const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';

  // Production Mode: Connect directly to MongoDB Atlas without falling back or seeding
  if (isProduction) {
    if (!process.env.MONGO_URI) {
      console.error('❌ FATAL: MONGO_URI environment variable is required in production.');
      process.exit(1);
    }

    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 15000, // 15s reasonable Atlas connection timeout
      });
      console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      console.error(`❌ FATAL: Failed to connect to MongoDB in production: ${error.message}`);
      process.exit(1);
    }
  }

  // Development / Test Mode: Attempt local MongoDB or fallback to MongoMemoryServer
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/foodlink', {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ Could not connect to local MongoDB (${error.message}).`);
    console.log(`⚡ Starting In-Memory MongoDB Server for development...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const { seedData } = await import('../seed.js');
      mongoMemoryServer = await MongoMemoryServer.create();
      const mongoUri = mongoMemoryServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`✅ In-Memory MongoDB Connected: ${conn.connection.host}`);
      console.log(`🌱 Auto-seeding initial database...`);
      await seedData();
    } catch (memErr) {
      console.error(`❌ In-Memory MongoDB startup failed: ${memErr.message}`);
      process.exit(1);
    }
  }
};

export default connectDB;
