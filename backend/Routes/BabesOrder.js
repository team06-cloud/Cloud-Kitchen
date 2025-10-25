const express = require("express");
const router = express.Router();
const Order4r = require("../models/Order4rest");

router.post("/YourOrder", async (req, res) => {
  try {
    const myData = await Order4r.find({
      email: req.body.email,
      order: { $exists: true },
    }).sort({ date: -1 });

    res.status(200).json({ myData: myData });
  } catch (err) {
    console.log(err);
    res
      .status(500)
      .json({
        data: null,
        error: "internal server errror /getOrderOfMyresturant",
      });
  }
});
module.exports = router;
