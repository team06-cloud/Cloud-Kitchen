require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function updateAdminDirect() {
  try {
    // Connect to MongoDB using the same connection string as in db.js
    await mongoose.connect(process.env.db_string || 'mongodb://localhost:27017/foodii', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔍 Connected to database. Updating admin password...');
    
    // Get the users collection directly
    const usersCollection = mongoose.connection.db.collection('users');
    
    // New password (change this to your desired password)
    const newPassword = 'admin123';
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the admin user
    const result = await usersCollection.updateOne(
      { email: 'admin@cloudkitchen.com' },
      { $set: { password: hashedPassword } }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Admin password updated successfully!');
      console.log('Email: admin@cloudkitchen.com');
      console.log(`Password: ${newPassword}`);
    } else {
      console.log('ℹ️ No admin user found. Creating one...');
      
      // Create admin user if not exists
      await usersCollection.insertOne({
        name: 'Admin',
        email: 'admin@cloudkitchen.com',
        password: hashedPassword,
        role: 'admin',
        location: 'Head Office',
        MobileNo: '1234567890',
        isActive: true,
        date: new Date()
      });
      
      console.log('✅ Admin user created successfully!');
      console.log('Email: admin@cloudkitchen.com');
      console.log(`Password: ${newPassword}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
}

// Run the function
updateAdminDirect();
