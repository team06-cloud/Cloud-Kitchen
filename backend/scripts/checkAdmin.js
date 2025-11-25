const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cloudkitchen', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import the User model
const User = require('../models/User');

async function checkAdmin() {
  try {
    // Check for any admin user
    const admin = await User.findOne({ email: 'admin@cloudkitchen.com' });
    
    if (admin) {
      console.log('✅ Admin user found:');
      console.log({
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive !== false
      });
    } else {
      console.log('❌ No admin user found with email: admin@cloudkitchen.com');
      console.log('Creating admin user...');
      
      // Create admin user
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      const newAdmin = new User({
        name: 'Admin',
        email: 'admin@cloudkitchen.com',
        password: hashedPassword,
        role: 'admin',
        location: 'Head Office',
        MobileNo: '1234567890'
      });
      
      await newAdmin.save();
      console.log('✅ Admin user created successfully!');
    }
  } catch (error) {
    console.error('Error checking admin user:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAdmin();
