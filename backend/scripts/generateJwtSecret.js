const crypto = require('crypto');

// Generate a secure random string for JWT secret
const generateJwtSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

const jwtSecret = generateJwtSecret();
const jwtRefreshSecret = generateJwtSecret();

console.log('Add these to your .env file:');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);

// Also show how to set them in Windows CMD
console.log('\nOr run these commands in your terminal:');
console.log(`set JWT_SECRET=${jwtSecret}`);
console.log(`set JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
