require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function updateAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.db_string || 'mongodb://localhost:27017/foodii', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔍 Connecting to database...');
    
    // Get the User model
    const User = mongoose.model('User');
    
    // New password (change this to your desired password)
    const newPassword = 'newAdminPassword123';
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the admin user
    const result = await User.updateOne(
      { email: 'admin@cloudkitchen.com' },
      { $set: { password: hashedPassword } }
    );
    
    if (result.nModified > 0) {
      console.log('✅ Admin password updated successfully!');
      console.log('New credentials:');
      console.log('Email: admin@cloudkitchen.com');
      console.log(`Password: ${newPassword}`);
    } else {
      console.log('ℹ️ No admin user found with email: admin@cloudkitchen.com');
    }
    
  } catch (error) {
    console.error('❌ Error updating admin password:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
}

// Run the function
updateAdminPassword();
