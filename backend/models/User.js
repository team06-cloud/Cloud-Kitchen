const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    MobileNo: {
      type: String,
      required: true,
      match: [/^[0-9]{10,15}$/, 'Please use a valid phone number'],
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'restaurant_owner'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    date:{
        type:Date,
        default:Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Create admin if not exists
const createDefaultAdmin = async () => {
  const adminEmail = 'admin@cloudkitchen.com';
  const adminExists = await mongoose.model('User').findOne({ email: adminEmail });
  
  if (!adminExists) {
    const admin = new (mongoose.model('User'))({
      name: 'Admin',
      email: adminEmail,
      password: 'admin123', // This will be hashed by the pre-save hook
      location: 'Head Office',
      MobileNo: '1234567890',
      role: 'admin',
    });
    
    await admin.save();
    console.log('Default admin user created');
  }
};

// Call the function when the model is loaded
setTimeout(createDefaultAdmin, 5000);

module.exports = mongoose.model('User', UserSchema);