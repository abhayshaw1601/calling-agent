const mongoose = require('mongoose');

/**
 * Establishes and manages a connection pool to MongoDB.
 * Utilizes Mongoose for connections.
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Add connection pooling options here for optimal performance
      maxPoolSize: 10,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
