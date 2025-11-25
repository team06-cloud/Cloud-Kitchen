const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { ObjectId } = require('mongodb');
const { authenticateToken } = require('../Middleware/auth');
const { ApiError } = require('../Middleware/errorHandler');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  // This is a placeholder - implement your admin check logic here
  // For example, check if user.role === 'admin' in the JWT
  next();
};

// Debug endpoint to check database connection and collections
router.get('/debug/db', authenticateToken, isAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      return res.status(500).json({ success: false, message: 'Database not connected' });
    }
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Get counts for each collection
    const counts = {};
    for (const name of collectionNames) {
      try {
        counts[name] = await db.collection(name).countDocuments();
      } catch (err) {
        counts[name] = `Error: ${err.message}`;
      }
    }
    
    // Get sample documents from each collection
    const samples = {};
    for (const name of collectionNames) {
      try {
        const sample = await db.collection(name).findOne({});
        if (sample) {
          samples[name] = {
            sampleDocument: sample,
            fields: Object.keys(sample)
          };
        }
      } catch (err) {
        samples[name] = { error: `Failed to get sample: ${err.message}` };
      }
    }

    res.json({
      success: true,
      db: db.databaseName,
      collections: collectionNames,
      counts,
      samples,
      status: 'Debug information retrieved successfully',
      note: 'Check the samples field to see the structure of documents in each collection'
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting debug information',
      error: error.message
    });
  }
});

// Get all food items
router.get('/food-items', authenticateToken, isAdmin, async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      console.error('❌ Database not connected in food-items route');
      throw new Error('Database not connected');
    }
    
    // Try multiple possible collection names
    let items = [];
    const collectionNames = ['food_items', 'fooditems', 'foodItems'];
    
    for (const collectionName of collectionNames) {
      try {
        const collection = db.collection(collectionName);
        items = await collection.find({}).toArray();
        if (items.length > 0) {
          console.log(`✅ Found ${items.length} food items in collection: ${collectionName}`);
          break;
        }
      } catch (err) {
        console.log(`ℹ️ Collection ${collectionName} not found, trying next...`);
      }
    }
    
    if (items.length === 0) {
      console.warn('⚠️ No food items found in any collection');
    }
    
    res.json({ 
      success: true, 
      data: items,
      count: items.length,
      message: items.length > 0 ? 'Food items retrieved successfully' : 'No food items found'
    });
  } catch (error) {
    console.error('❌ Error in /api/admin/food-items:', error);
    next(new ApiError(500, 'Failed to fetch food items', error.message));
  }
});

// Create a new food item
router.post(
  '/food-items',
  authenticateToken,
  isAdmin,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('price').isNumeric().withMessage('Valid price is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('img').isURL().withMessage('Valid image URL is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const db = req.app.locals.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const foodItem = {
        ...req.body,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('food_items').insertOne(foodItem);
      const insertedItem = await db.collection('food_items').findOne({ _id: result.insertedId });

      res.status(201).json({ success: true, data: insertedItem });
    } catch (error) {
      next(error);
    }
  }
);

// Update a food item
router.put(
  '/food-items/:id',
  authenticateToken,
  isAdmin,
  [
    body('name').optional().trim().notEmpty(),
    body('price').optional().isNumeric(),
    body('category').optional().notEmpty(),
    body('img').optional().isURL()
  ],
  async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const updateData = { 
        ...req.body,
        updatedAt: new Date() 
      };

      const result = await db.collection('food_items').findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        throw new ApiError(404, 'Food item not found');
      }

      res.json({ success: true, data: result.value });
    } catch (error) {
      next(error);
    }
  }
);

// Delete a food item
router.delete('/food-items/:id', authenticateToken, isAdmin, async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      throw new Error('Database not connected');
    }

    const result = await db.collection('food_items').findOneAndDelete({ 
      _id: new ObjectId(req.params.id) 
    });

    if (!result.value) {
      throw new ApiError(404, 'Food item not found');
    }

    res.json({ success: true, message: 'Food item deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Get all food categories
router.get('/categories', authenticateToken, isAdmin, async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      console.error('❌ Database not connected in categories route');
      throw new Error('Database not connected');
    }
    
    // Try multiple possible collection names - 'foodCategory' is the correct one based on debug output
    let categories = [];
    const collectionNames = ['foodCategory', 'foodcategories', 'foodCategories', 'categories', 'food_category'];
    
    for (const collectionName of collectionNames) {
      try {
        const collection = db.collection(collectionName);
        categories = await collection.find({}).toArray();
        if (categories.length > 0) {
          console.log(`✅ Found ${categories.length} categories in collection: ${collectionName}`);
          break;
        }
      } catch (err) {
        console.log(`ℹ️ Collection ${collectionName} not found, trying next...`);
      }
    }
    
    if (categories.length === 0) {
      console.warn('⚠️ No categories found in any collection');
    }
    
    res.json({ 
      success: true, 
      data: categories,
      count: categories.length,
      message: categories.length > 0 ? 'Categories retrieved successfully' : 'No categories found'
    });
  } catch (error) {
    console.error('❌ Error in /api/admin/categories:', error);
    next(new ApiError(500, 'Failed to fetch categories', error.message));
  }
});

// Create a new food category
router.post(
  '/categories',
  authenticateToken,
  isAdmin,
  [
    body('CategoryName').trim().notEmpty().withMessage('Category name is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new ApiError(400, 'Validation failed', errors.array());
      }

      const db = req.app.locals.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const category = {
        CategoryName: req.body.CategoryName,
        description: req.body.description || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('foodcategories').insertOne(category);
      const insertedCategory = await db.collection('foodcategories').findOne({ _id: result.insertedId });

      res.status(201).json({ success: true, data: insertedCategory });
    } catch (error) {
      next(error);
    }
  }
);

// Update a food category
router.put(
  '/categories/:id',
  authenticateToken,
  isAdmin,
  [
    body('CategoryName').trim().notEmpty().withMessage('Category name is required')
  ],
  async (req, res, next) => {
    try {
      const db = req.app.locals.db;
      if (!db) {
        throw new Error('Database not connected');
      }

      const updateData = {
        CategoryName: req.body.CategoryName,
        description: req.body.description || '',
        updatedAt: new Date()
      };

      const result = await db.collection('foodcategories').findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!result.value) {
        throw new ApiError(404, 'Category not found');
      }

      res.json({ success: true, data: result.value });
    } catch (error) {
      next(error);
    }
  }
);

// Delete a food category
router.delete('/categories/:id', authenticateToken, isAdmin, async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      throw new Error('Database not connected');
    }

    // Check if any food items are using this category
    const itemsCount = await db.collection('food_items').countDocuments({ 
      category: req.params.id 
    });

    if (itemsCount > 0) {
      throw new ApiError(400, 'Cannot delete category with associated food items');
    }

    const result = await db.collection('foodcategories').findOneAndDelete({ 
      _id: new ObjectId(req.params.id) 
    });

    if (!result.value) {
      throw new ApiError(404, 'Category not found');
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Update the food data in global variables (for backward compatibility)
router.post('/update-food-data', authenticateToken, isAdmin, async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    if (!db) {
      throw new Error('Database not connected');
    }

    const [foodItems, foodCategories] = await Promise.all([
      db.collection('food_items').find({}).toArray(),
      db.collection('foodcategories').find({}).toArray()
    ]);
    
    // This updates the global variables used by the existing /api/foodData endpoint
    global.food_items = foodItems;
    global.foodCategory = foodCategories;
    
    res.json({ 
      success: true, 
      message: 'Food data updated successfully',
      counts: {
        items: foodItems.length,
        categories: foodCategories.length
      }
    });
  } catch (error) {
    next(new ApiError(500, 'Failed to update food data', error.message));
  }
});

module.exports = router;