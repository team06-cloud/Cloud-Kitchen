const express = require("express");
const router = express.Router();

const fetchFoodData = async (db) => {
  const [foodItems, foodCategories] = await Promise.all([
    db.collection('food_items').find({}).toArray(),
    db.collection('foodCategory').find({}).toArray()
  ]);

  return {
    success: true,
    foodItems,
    foodCategories,
    data: [foodItems, foodCategories] // legacy array response for backwards compatibility
  };
};

const handleFoodDataRequest = async (req, res) => {
  try {
    const db = req.app?.locals?.db;

    if (!db) {
      console.error('Database not connected when fetching food data');
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    const response = await fetchFoodData(db);
    res.json(response);
  } catch (error) {
    console.error('Error fetching food data:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching food data',
      error: error.message
    });
  }
};

// Support both GET and POST for compatibility with existing frontend code
router.get("/", handleFoodDataRequest);
router.post("/", handleFoodDataRequest);

module.exports = router;
