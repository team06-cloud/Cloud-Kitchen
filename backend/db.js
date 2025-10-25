const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({});

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.db_string, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    console.log("Connected to MongoDB successfully");

    await fetchFoodItems();
  } catch (error) {
    console.error("MongoDB connection error:", error);
    console.log("Not connected to MongoDB");
  }
};

const fetchFoodItems = async () => {
  try {
    const fetched_data = await mongoose.connection.db.collection("food_items");
    const data = await fetched_data.find({}).toArray();

    const foodCategory = await mongoose.connection.db.collection(
      "foodCategory"
    );
    const catdata = await foodCategory.find({}).toArray();

    const ResturentUsers = await mongoose.connection.db.collection("Resturent");
    const resturentUser = await ResturentUsers.find({}).toArray();

    global.food_items = data;
    global.foodCategory = catdata;
    global.resturentUser = resturentUser;

    console.log("Data fetched and stored in global variables successfully");
  } catch (err) {
    console.error("Error fetching data from collections:", err);
  }
};

module.exports = connectDb;
