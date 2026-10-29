const dns = require('dns');
const mongoose = require('mongoose');

const DEFAULT_DB_NAME = '236435_PhanTuanAnh';

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME;

  if (!uri) {
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  const options = {
    dbName,
    serverSelectionTimeoutMS: 10000,
  };

  try {
    await mongoose.connect(uri, options);
  } catch (err) {
    if (uri.startsWith('mongodb+srv://') && /querySrv/i.test(String(err && err.message))) {
      const existingServers = dns.getServers();
      const fallbackServers = Array.from(new Set(['8.8.8.8', '1.1.1.1', ...existingServers]));
      dns.setServers(fallbackServers);
      await mongoose.connect(uri, options);
    } else {
      throw err;
    }
  }

  console.log(`Connected to MongoDB Atlas database: ${mongoose.connection.name}`);
  return mongoose.connection;
}

module.exports = { connectDB, DEFAULT_DB_NAME };
