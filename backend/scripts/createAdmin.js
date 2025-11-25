require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import the User model
const User = require('../models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB using the same connection string as in db.js
    await mongoose.connect(process.env.db_string || 'mongodb://localhost:27017/cloudkitchen', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔍 Checking for existing admin user...');
    
    // Check if admin exists
    const admin = await User.findOne({ email: 'admin@cloudkitchen.com' });
    
    if (admin) {
      console.log('✅ Admin user already exists:');
      console.log({
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive !== false
      });
      return;
    }
    
    console.log('❌ No admin user found. Creating one...');
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Create admin user
    const newAdmin = new User({
      name: 'Admin',
      email: 'admin@cloudkitchen.com',
      password: hashedPassword,
      role: 'admin',
      location: 'Head Office',
      MobileNo: '1234567890',
      isActive: true
    });
    
    await newAdmin.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@cloudkitchen.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
}

// Run the function
createAdmin();
