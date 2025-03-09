const express = require("express");
const bcrypt = require("bcryptjs"); // Secure password storage
const nodemailer = require("nodemailer");
const User = require("../models/User");
const router = express.Router();

const dotenv = require('dotenv');
// Load environment variables
dotenv.config();

const OTP_EXPIRY_TIME = 2 * 60 * 1000; // 2 minutes
const SALT_ROUNDS = 10; // For password hashing

// Configure nodemailer with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER.trim(),
    pass: process.env.EMAIL_PASSWORD.trim(),
  },
});

// Verify transporter connection
transporter.verify((error) => {
  if (error) {
    return;
  }
});

// 🔹 Function to generate a 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 🔹 Function to send OTP email
const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: { name: "Codeforces App", address: process.env.EMAIL_USER.trim() },
    to: email,
    subject: "Password Reset OTP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2e7d32;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>Your OTP for password reset is:</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2e7d32; margin: 0; font-size: 32px;">${otp}</h1>
        </div>
        <p>This OTP expires in 5 minutes.</p>
        <p style="color: #666;">If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">This is an automated email, please do not reply.</p>
      </div>
    `,
  };
  await transporter.sendMail(mailOptions);
};

// 🔹 Route to send OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate OTP and expiry time
    const otp = generateOTP();
    const otpExpiry = Date.now() + OTP_EXPIRY_TIME;

    await User.updateOne({ email }, { resetPasswordOtp: otp, resetPasswordExpiry: otpExpiry });

    // Send OTP email
    await sendOTPEmail(email, otp);

    res.json({ message: "OTP sent successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error sending OTP" });
  }
});

// 🔹 Route to verify OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, resetPasswordOtp: otp, resetPasswordExpiry: { $gt: Date.now() } });

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    res.json({ message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error verifying OTP" });
  }
});

// 🔹 Route to reset password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email, resetPasswordOtp: otp, resetPasswordExpiry: { $gt: Date.now() } });

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password and clear OTP fields
    await User.updateOne(
      { email },
      { password: hashedPassword, resetPasswordOtp: null, resetPasswordExpiry: null }
    );

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Error resetting password" });
  }
});

module.exports = router;
