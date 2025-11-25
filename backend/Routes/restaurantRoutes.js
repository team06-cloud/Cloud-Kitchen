const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const { authenticateRestaurant, RESTAURANT_JWT_SECRET } = require('../Middleware/restaurantAuth');

const router = express.Router();

const REQUIRED_FIELDS = ['name', 'email', 'password'];
const OPTIONAL_FIELDS = [
  'phone',
  'address',
  'city',
  'state',
  'postalCode',
  'country',
  'cuisine',
  'bio',
  'logoUrl',
  'ownerName'
];

const MENU_REQUIRED_FIELDS = ['name', 'price', 'category'];
const MENU_OPTIONAL_FIELDS = ['description', 'imageUrl', 'isAvailable'];

const parseOrigins = (value) =>
  value
    ? value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];

const sanitizeRestaurant = (restaurant) => {
  if (!restaurant) return null;

  const {
    _id,
    passwordHash,
    menuItems = [],
    createdAt,
    updatedAt,
    ...rest
  } = restaurant;

  return {
    id: _id.toString(),
    menuItems: menuItems.map((item) => ({
      ...item,
      _id: item._id ? item._id.toString() : undefined
    })),
    createdAt,
    updatedAt,
    ...rest
  };
};

const generateRestaurantCode = (name = '') => {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 24);

  const random = Math.random().toString(36).slice(2, 6);
  return `${slug || 'restaurant'}-${random}`;
};

const buildMenuItem = ({ name, price, category, description, imageUrl, isAvailable }) => ({
  _id: new ObjectId(),
  name: name.trim(),
  category: category.trim(),
  price: Number(price),
  description: description?.trim() || '',
  imageUrl: imageUrl?.trim() || '',
  isAvailable: typeof isAvailable === 'boolean' ? isAvailable : true,
  createdAt: new Date(),
  updatedAt: new Date()
});

const extractPriceFromLegacyItem = (item) => {
  if (typeof item?.price === 'number' && !Number.isNaN(item.price)) {
    return item.price;
  }

  if (typeof item?.price === 'string') {
    const parsed = Number(item.price.replace(/[^0-9.]/g, ''));
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  if (Array.isArray(item?.options) && item.options.length > 0) {
    const optionValues = Object.values(item.options[0] || {});
    const numeric = optionValues
      .map((value) => {
        if (typeof value === 'number') {
          return value;
        }
        if (typeof value === 'string') {
          const parsed = Number(value.replace(/[^0-9.]/g, ''));
          return Number.isNaN(parsed) ? null : parsed;
        }
        return null;
      })
      .find((value) => value !== null);

    if (numeric !== undefined && numeric !== null) {
      return numeric;
    }
  }

  return 0;
};

const legacyFoodItemToMenuItem = (item) => {
  const name = item?.name || item?.itemName || 'Menu item';
  const category = item?.CategoryName || item?.category || 'General';

  return {
    _id: new ObjectId(),
    name,
    category,
    price: extractPriceFromLegacyItem(item),
    description: item?.description || '',
    imageUrl: item?.img || item?.imageUrl || '',
    isAvailable: item?.isAvailable !== false,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

const getDb = (req) => {
  const db = req.app?.locals?.db;
  if (!db) {
    throw new Error('Database connection not available');
  }
  return db;
};

const createJwt = (restaurantId) =>
  jwt.sign({ restaurantId }, RESTAURANT_JWT_SECRET, { expiresIn: '7d' });

const validateFields = (body, requiredFields) => {
  const missing = requiredFields.filter((field) => !body[field]);
  return missing;
};

router.post('/register', async (req, res) => {
  try {
    const missingFields = validateFields(req.body, REQUIRED_FIELDS);
    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const db = getDb(req);
    const restaurantsCollection = db.collection('restaurants');

    const email = req.body.email.toLowerCase();
    const existing = await restaurantsCollection.findOne({ email });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A restaurant with this email already exists'
      });
    }

    const passwordHash = await bcrypt.hash(req.body.password, 10);
    const now = new Date();
    let restaurantCode = generateRestaurantCode(req.body.name);

    let attempts = 0;
    while (attempts < 5) {
      const conflict = await restaurantsCollection.findOne({ restaurantCode });
      if (!conflict) break;
      restaurantCode = generateRestaurantCode(req.body.name);
      attempts += 1;
    }

    const restaurantDoc = {
      name: req.body.name.trim(),
      email,
      passwordHash,
      restaurantCode,
      phone: req.body.phone?.trim() || '',
      address: req.body.address?.trim() || '',
      city: req.body.city?.trim() || '',
      state: req.body.state?.trim() || '',
      postalCode: req.body.postalCode?.trim() || '',
      country: req.body.country?.trim() || '',
      cuisine: req.body.cuisine?.trim() || '',
      bio: req.body.bio?.trim() || '',
      logoUrl: req.body.logoUrl?.trim() || '',
      ownerName: req.body.ownerName?.trim() || '',
      menuItems: [],
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    const result = await restaurantsCollection.insertOne(restaurantDoc);
    const token = createJwt(result.insertedId.toString());

    const restaurant = await restaurantsCollection.findOne({ _id: result.insertedId });

    return res.status(201).json({
      success: true,
      token,
      restaurant: sanitizeRestaurant(restaurant)
    });
  } catch (error) {
    console.error('Restaurant registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register restaurant'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const missingFields = validateFields(req.body, ['email', 'password']);
    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const db = getDb(req);
    const restaurantsCollection = db.collection('restaurants');

    const email = req.body.email.toLowerCase();
    const restaurant = await restaurantsCollection.findOne({ email, isActive: { $ne: false } });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    const passwordMatch = await bcrypt.compare(req.body.password, restaurant.passwordHash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = createJwt(restaurant._id.toString());

    return res.json({
      success: true,
      token,
      restaurant: sanitizeRestaurant(restaurant)
    });
  } catch (error) {
    console.error('Restaurant login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to authenticate restaurant'
    });
  }
});

router.get('/me', authenticateRestaurant, async (req, res) => {
  try {
    const restaurant = sanitizeRestaurant(req.restaurant);
    return res.json({ success: true, restaurant });
  } catch (error) {
    console.error('Fetch restaurant profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch restaurant profile'
    });
  }
});

router.put('/me', authenticateRestaurant, async (req, res) => {
  try {
    const db = getDb(req);
    const restaurantsCollection = db.collection('restaurants');

    const allowedUpdates = [...OPTIONAL_FIELDS];
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (field in req.body) {
        updates[field] = typeof req.body[field] === 'string'
          ? req.body[field].trim()
          : req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    updates.updatedAt = new Date();

    const result = await restaurantsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.restaurant._id) },
      { $set: updates },
      { returnDocument: 'after' }
    );

    return res.json({
      success: true,
      restaurant: sanitizeRestaurant(result.value)
    });
  } catch (error) {
    console.error('Update restaurant profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update restaurant profile'
    });
  }
});

router.post('/menu', authenticateRestaurant, async (req, res) => {
  try {
    const missingFields = validateFields(req.body, MENU_REQUIRED_FIELDS);
    if (missingFields.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`
      });
    }

    const db = getDb(req);
    const restaurantsCollection = db.collection('restaurants');

    const menuItem = buildMenuItem(req.body);

    const result = await restaurantsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.restaurant._id) },
      {
        $push: {
          menuItems: menuItem
        },
        $set: {
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    const restaurant = sanitizeRestaurant(result.value);
    const createdItem = restaurant.menuItems.find((item) => item._id === menuItem._id.toString());

    return res.status(201).json({
      success: true,
      menuItem: createdItem,
      restaurant
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add menu item'
    });
  }
});

router.put('/menu/:itemId', authenticateRestaurant, async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu item id'
      });
    }

    const updates = {};

    [...MENU_REQUIRED_FIELDS, ...MENU_OPTIONAL_FIELDS].forEach((field) => {
      if (field in req.body) {
        updates[`menuItems.$.${field}`] =
          field === 'price'
            ? Number(req.body[field])
            : typeof req.body[field] === 'string'
            ? req.body[field].trim()
            : req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update'
      });
    }

    updates['menuItems.$.updatedAt'] = new Date();

    const db = getDb(req);
    const restaurantsCollection = db.collection('restaurants');

    const result = await restaurantsCollection.findOneAndUpdate(
      {
        _id: new ObjectId(req.restaurant._id),
        'menuItems._id': new ObjectId(itemId)
      },
      {
        $set: updates,
        $currentDate: {
          updatedAt: true
        }
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const restaurant = sanitizeRestaurant(result.value);
    const updatedItem = restaurant.menuItems.find((item) => item._id === itemId);

    return res.json({
      success: true,
      menuItem: updatedItem,
      restaurant
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update menu item'
    });
  }
});

router.delete('/menu/:itemId', authenticateRestaurant, async (req, res) => {
  try {
    const { itemId } = req.params;
    if (!ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid menu item id'
      });
    }

    const db = getDb(req);
    const restaurantsCollection = db.collection('restaurants');

    const result = await restaurantsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.restaurant._id) },
      {
        $pull: {
          menuItems: { _id: new ObjectId(itemId) }
        },
        $set: {
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    return res.json({
      success: true,
      restaurant: sanitizeRestaurant(result.value)
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete menu item'
    });
  }
});

router.post('/menu/import-legacy', authenticateRestaurant, async (req, res) => {
  try {
    const { foodItemIds } = req.body || {};

    const db = getDb(req);
    const restaurantsCollection = db.collection('restaurants');
    const foodItemsCollection = db.collection('food_items');

    const existingRestaurant = await restaurantsCollection.findOne({
      _id: new ObjectId(req.restaurant._id)
    });

    if (!existingRestaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found'
      });
    }

    let query = {};
    if (Array.isArray(foodItemIds) && foodItemIds.length > 0) {
      const validIds = foodItemIds
        .map((id) => {
          try {
            return new ObjectId(id);
          } catch (err) {
            return null;
          }
        })
        .filter(Boolean);

      if (validIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid food item ids provided'
        });
      }

      query = { _id: { $in: validIds } };
    }

    const legacyItems = await foodItemsCollection.find(query).toArray();

    if (legacyItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No matching food items found to import'
      });
    }

    const existingNames = new Set(
      (existingRestaurant.menuItems || []).map((item) => (item.name || '').trim().toLowerCase())
    );

    const newItems = legacyItems
      .map((item) => legacyFoodItemToMenuItem(item))
      .filter((item) => {
        const key = item.name.trim().toLowerCase();
        if (!key) {
          return false;
        }

        if (existingNames.has(key)) {
          return false;
        }

        existingNames.add(key);
        return true;
      });

    if (newItems.length === 0) {
      return res.status(200).json({
        success: true,
        imported: 0,
        skipped: legacyItems.length,
        message: 'All selected food items already exist in your menu'
      });
    }

    const result = await restaurantsCollection.findOneAndUpdate(
      { _id: new ObjectId(req.restaurant._id) },
      {
        $push: {
          menuItems: { $each: newItems }
        },
        $set: {
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    return res.json({
      success: true,
      imported: newItems.length,
      skipped: legacyItems.length - newItems.length,
      restaurant: sanitizeRestaurant(result.value)
    });
  } catch (error) {
    console.error('Import legacy menu items error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to import legacy menu items'
    });
  }
});

module.exports = router;
