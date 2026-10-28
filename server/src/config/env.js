const path = require('path');
const dotenv = require('dotenv');

// override: true so server/.env wins over a Windows/user MONGODB_URI (common cause of "local" while .env says Atlas)
dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function loadEnv() {
  return {
    port: Number(process.env.PORT) || 5000,
    mongoUri: required('MONGODB_URI'),
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    inviteExpiryDays: Number(process.env.INVITE_EXPIRY_DAYS) || 7,
    cloudinary: {
      cloudName: required('CLOUDINARY_CLOUD_NAME'),
      apiKey: required('CLOUDINARY_API_KEY'),
      apiSecret: required('CLOUDINARY_API_SECRET')
    }
  };
}

module.exports = { loadEnv };
