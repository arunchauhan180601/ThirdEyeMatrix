const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const { db } = require("../../config/db");
const nodemailer = require("nodemailer");
const JWT_SECRET = process.env.JWT_SECRET || "secret123";


module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  let user;
  let isSuperAdmin = true;

  // Try to find in Admin table
  user = await db("admins")
    .where({ email })
    .first();

  if (user) {
    const role = await db("roles").where({ id: user.role_id }).first();
    if (role) {
      user.role = role;
      user.role.permissions = await db("role_permissions")
        .where({ role_id: role.id })
        .join("permissions", "role_permissions.permission_id", "permissions.id")
        .select("permissions.name");
    }
  } else {
    // If not in Admin, check AdminUser table
    user = await db("admin_users")
      .where({ email })
      .first();
    isSuperAdmin = false;

    if (user) {
      const role = await db("roles").where({ id: user.role_id }).first();
      if (role) {
        user.role = role;
        user.role.permissions = await db("role_permissions")
          .where({ role_id: role.id })
          .join("permissions", "role_permissions.permission_id", "permissions.id")
          .select("permissions.name");
      }
    }
  }
  if (!user) return res.status(401).json({ message: "Entered email is incorrect" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Entered password is incorrect" });

  const permissions = user.role.permissions.map((p) => p.name);

  const token = jwt.sign(
    { id: user.id, name: user.name, first_name:user.first_name, last_name:user.last_name, roleName: user.role.name },
    JWT_SECRET,
    { expiresIn: "2d" }
  );

  res.json({
    token,
    role: user.role.name,
    permissions,
  });
};

module.exports.sendOtp = async (req, res) => {
  const { email } = req.body;

  try {
    let user = await db("admins").where({ email: email.trim() }).first();
    let userTable = "admins";

    if (!user) {
      user = await db("admin_users").where({ email: email.trim() }).first();
      userTable = "admin_users";
    }

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db(userTable)
      .where({ id: user.id })
      .update({ otp: otp, otp_expires_at: expiresAt });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.OTP_EMAIL,
        pass: process.env.OTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.OTP_EMAIL,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: "Error sending OTP." });
      }

      console.log("OTP sent: " + info.response);
      return res.json({
        success: true,
        message: "OTP sent successfully.",
        userId: user.id,
      });
    });
  } catch (err) {
    console.error("Error in sendOtp:", err);
    return res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
};

module.exports.verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    let user = await db("admins").where({ email: email.trim() }).first();
    let userTable = "admins";

    if (!user) {
      user = await db("admin_users").where({ email: email.trim() }).first();
      userTable = "admin_users";
    }

    if (!user) {
      return res.status(400).json({ success: false, message: "User not found." });
    }

    if (!user.otp || !user.otp_expires_at) {
      return res.status(400).json({ success: false, message: "OTP not found." });
    }

    const currentTime = new Date();
    const otpExpiresAt = new Date(user.otp_expires_at);
    if (currentTime > otpExpiresAt) {
      await db(userTable).where({ id: user.id }).update({ otp: null, otp_expires_at: null });
      return res.status(400).json({ success: false, message: "OTP has expired." });
    }

    if (otp === user.otp) {
      await db(userTable).where({ id: user.id }).update({ otp: null, otp_expires_at: null });
      return res.json({ success: true, message: "OTP verified successfully.", userId: user.id });
    } else {
      return res.status(400).json({ success: false, message: "Invalid OTP." });
    }
  } catch (err) {
    console.error("Error verifying OTP:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports.resetPassword = async (req, res) => {
  try {
    const { userId, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    let user = await db("admins").where({ id: userId }).first();
    let userTable = "admins";

    if (!user) {
      user = await db("admin_users").where({ id: userId }).first();
      userTable = "admin_users";
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db(userTable).where({ id: user.id }).update({ password: hashedPassword });

    return res.json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (err) {
    console.error("Error in resetPassword:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};