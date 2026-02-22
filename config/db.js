const mongoose = require('mongoose');
//connectiong to the db will keep retrying 
const connectDB = async (retries = 5, delay = 3000) => {
  for (let i = 1; i <= retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected');
      return;
    } catch (error) {
      console.error(`MongoDB attempt ${i}/${retries} failed: ${error.message}`);
      if (i === retries) {
        console.error('Could not connect to MongoDB. Exiting.');
        process.exit(1);
      }
      console.log(`Retrying in ${delay / 1000}s...`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
};

module.exports = connectDB;