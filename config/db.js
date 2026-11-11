const mongoose = require('mongoose');
const { ConfigurationError, getMongoUri, redact } = require('./secrets');

const connectDB = async () => {
  try {
    await mongoose.connect(getMongoUri(), {
      useNewUrlParser: true,
    });
    console.log('MongoDB Connected..');
  } catch (err) {
    if (err instanceof ConfigurationError) {
      console.error(`[config] ${err.message}`);
    } else {
      console.error(`Error connecting to MongoDB: ${redact(err.message)}`);
    }
    //Exite process with failure
    process.exit(1);
  }
};

module.exports = connectDB;
