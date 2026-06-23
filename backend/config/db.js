const mongoose = require('mongoose');
const dns = require('dns');

// Use Google DNS for SRV resolution (fix for Windows DNS issues)
dns.setServers(['8.8.8.8', '8.8.4.4']);

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/animestyle';
  try {
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB');
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
