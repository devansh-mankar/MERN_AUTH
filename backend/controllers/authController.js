import bcrypt from "bcryptjs";
import { User } from "../models/userSchema.js";
import { generateToken } from "../utils/generateToken.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessMail,
} from "../mailtrap/emails.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto";

export const signup = async (req, res) => {
  const { email, password, name } = req.body;

  try {
    if (!email || !password || !name) {
      throw new Error("All fields are required!");
    }

    const userAlreadyExists = await User.findOne({ email });

    if (userAlreadyExists) {
      return res.status(401).json({
        success: false,
        message: "User already exists!",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = new User({
      email,
      password: hashedPassword,
      name,
      verificationToken,
      verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), //24 hours
    });
    await user.save();

    generateToken(res, user._id);
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      success: true,
      message: "user created successfully!",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  const { code } = req.body;

  try {
    const user = await User.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() },
    });

    console.log("Token Expiry: ", user?.verificationTokenExpiresAt);
    console.log("Current Time: ", Date.now());

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification Code!",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    //user.verificationTokenExpiresAt = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.name);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    console.log("error in verifyEmail ", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials!",
      });
    }
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials!",
      });
    }

    generateToken(res, user._id);

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Logged in Successfully!",
      user: {
        ...user._doc,
        password: undefined,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logged Out Successfully!",
  });
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found!",
      });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000;

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;

    await user.save();
    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );

    res.status(200).json({
      success: true,
      message: "Password Reset Link Sent To Your Email!",
    });
  } catch (error) {
    console.log("Error in forgot password", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiresAt: { $gt: Date.now() },
    });
    console.log("Reset Token: ", user?.resetPasswordToken);
    console.log("Token Expiry: ", user?.resetPasswordExpiresAt);
    console.log("Current Time: ", Date.now());
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token!",
      });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;

    await user.save();

    await sendResetSuccessMail(user.email);

    res.status(200).json({
      success: true,
      message: "password reset successfully!",
    });
  } catch (error) {
    console.log("Error in reset password", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const checkAuth = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found!",
      });
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log("Error in checkAuth", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
