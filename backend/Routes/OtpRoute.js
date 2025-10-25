// require('dotenv').config();
// const express = require('express');
// const router = express.Router();
// const nodemailer = require('nodemailer');
// const crypto = require('crypto');
// const twilio = require('twilio');


// const dotenv=require('dotenv')
// dotenv.config({})


// const otps = {}; // Temporarily store OTPs for simplicity, use a database in production

// const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// // Route to request OTP for email verification
// router.post('/request-email-otp', async (req, res) => {
//   const { email } = req.body;
//   if (!email) {
//     return res.status(400).json({ success: false, message: 'Email is required' });
//   }

//   const otp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP

//   // Configure nodemailer
//   const transporter = nodemailer.createTransport({
//     service: 'gmail',
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS
//     }
//   });

//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: email,
//     subject: 'Your OTP Code',
//     text: `Your OTP code is ${otp}`
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     otps[email] = otp; // Store OTP in memory
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Failed to send OTP' });
//   }
// });

// // Route to request OTP for mobile verification
// router.post('/request-mobile-otp', async (req, res) => {
//   const { mobile } = req.body;
//   if (!mobile) {
//     return res.status(400).json({ success: false, message: 'Mobile number is required' });
//   }

//   const otp = crypto.randomInt(100000, 999999).toString(); // Generate a 6-digit OTP

//   try {
//     await twilioClient.messages.create({
//       body: `Your OTP code is ${otp}`,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: mobile
//     });
//     otps[mobile] = otp; // Store OTP in memory
//     res.json({ success: true });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: 'Failed to send OTP' });
//   }
// });

// // Route to verify OTP
// router.post('/verify-otp', (req, res) => {
//   const { email, mobile, otp } = req.body;

//   if (email && otps[email] === otp) {
//     delete otps[email]; // OTP verified and used, delete it
//     return res.json({ success: true, message: 'Email verified successfully' });
//   }

//   if (mobile && otps[mobile] === otp) {
//     delete otps[mobile]; // OTP verified and used, delete it
//     return res.json({ success: true, message: 'Mobile number verified successfully' });
//   }

//   res.status(400).json({ success: false, message: 'Invalid OTP' });
// });

// module.exports = router;
