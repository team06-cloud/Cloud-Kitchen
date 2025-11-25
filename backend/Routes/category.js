const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');

// Get database connection
const db = mongoose.connection.db;

// Get all categories
router.get("/", async (req, res) => {
  try {
    const categories = await db.collection('foodcategories').find({}).toArray();
    res.json({ 
      success: true, 
      data: categories 
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false, 
      message: "Server Error",
      error: error.message 
    });
  }
});

module.exports = router;
