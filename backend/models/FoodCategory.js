const mongoose = require('mongoose');

const foodCategorySchema = new mongoose.Schema({
  CategoryName: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FoodCategory', foodCategorySchema);
