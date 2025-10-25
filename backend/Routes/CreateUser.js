const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Resturent = require("../models/Resturent");
const Order = require("../models/Orders");
const Order4r = require("../models/Order4rest");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const jwtSecret = "mynameisajayshakyaIamFrommyownw";
const jwtSecret2 = "mynameisajayshakyaIam";

router.post(
  "/creatuser",
  [body("email").isEmail(), body("name")],
  async (req, res) => {
    console.log(req.body);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const existingUser = await User.findOne({ email: req.body.email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "User already exists with this email",
        });
      }

      const salt = await bcrypt.genSalt(10);
      let secPassword = await bcrypt.hash(req.body.password, salt);

      await User.create({
        name: req.body.name,
        email: req.body.email,
        location: req.body.location,
        password: secPassword,
        MobileNo: req.body.MobileNo,
      });

      res.json({ success: true, message: "Successfully signed up" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, error: "Server error" });
    }
  }
);

router.post(
  "/loginuser",
  [body("email").isEmail(), body("password", "Incorrect password")],
  async (req, res) => {
    console.log(req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    let email = req.body.email;
    try {
      let userData = await User.findOne({ email });
      if (!userData) {
        return res.status(400).json({ errors: "Email not found" });
      }

      const pwdCompare = await bcrypt.compare(
        req.body.password,
        userData.password
      );
      if (!pwdCompare) {
        return res.status(400).json({ errors: "Invalid credentials" });
      }

      const data = {
        user: {
          id: userData.id,
        },
      };

      const authToken = jwt.sign(data, jwtSecret);
      return res.json({ success: true, authToken: authToken });
    } catch (error) {
      console.log(error);
      res.json({ success: false });
    }
  }
);

router.get("/getOrderOfMyresturant", async (req, res) => {
  try {
    const data = await Order4r.find({ order: { $exists: true } }).sort({
      date: -1,
    });

    res.status(200).json({ data: data });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      data: null,
      error: "Internal server error /getOrderOfMyresturant",
    });
  }
});

router.post("/authenticateResturent", async (req, res) => {
  try {
    const { resturentId, password, MobileNo } = req.body;
    console.log(req.body);

    const token = req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, jwtSecret2);
        return res.status(200).json({
          success: true,
          message: "Already logged in",
          alreadyLoggedIn: true,
        });
      } catch (err) {}
    }

    const data = await Resturent.findOne({ resturentId });
    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    if (password !== data.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const registeredUser = {
      user: {
        id: data.id,
      },
    };
    const authToken2 = jwt.sign(registeredUser, jwtSecret2);

    return res.status(200).json({
      success: true,
      authToken2,
      message: "Successfully logged in",
    });
  } catch (err) {
    console.log("Auth error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during authentication",
    });
  }
});

module.exports = router;
