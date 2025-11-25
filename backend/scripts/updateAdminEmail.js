require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function updateAdminEmail() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.db_string || 'mongodb://localhost:27017/foodii', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('🔍 Connected to database. Updating admin email...');
    
    // Get the users collection
    const usersCollection = mongoose.connection.db.collection('users');
    
    // Update the admin email
    const result = await usersCollection.updateOne(
      { email: 'admin@cloudkitchen.com' },
      { $set: { email: 'adminteamsix@gmail.com' } }
    );
    
    if (result.matchedCount > 0) {
      console.log('✅ Admin email updated successfully!');
      console.log('Old email: admin@cloudkitchen.com');
      console.log('New email: adminteamsix@gmail.com');
      
      // Also update the admin user if it exists in the User model
      try {
        const User = require('../models/User');
        await User.updateOne(
          { email: 'admin@cloudkitchen.com' },
          { $set: { email: 'adminteamsix@gmail.com' } }
        );
      } catch (err) {
        console.log('ℹ️ Could not update User model (might not exist yet)');
      }
    } else {
      console.log('ℹ️ No admin user found with email: admin@cloudkitchen.com');
      
      // Create admin user if not exists
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await usersCollection.insertOne({
        name: 'Admin',
        email: 'adminteamsix@gmail.com',
        password: hashedPassword,
        role: 'admin',
        location: 'Head Office',
        MobileNo: '1234567890',
        isActive: true,
        date: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Admin user created with email: adminteamsix@gmail.com');
    }
    
  } catch (error) {
    console.error('❌ Error updating admin email:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed.');
  }
}

// Run the function
updateAdminEmail();
