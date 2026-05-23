import bcrypt from "bcrypt";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// POST /api/signup
router.post("/signup", async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });

    await newUser.save();

    // Generate JWT
    const token = jwt.sign(
      {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.status(201).json({
      token,
      username: newUser.username,
      email: newUser.email,
    });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error (username or email already exists)
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }
    res.status(400).json({ error: err.message });
  }
});

// POST /api/login
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Decide whether identifier is email or username
    const query = identifier.includes("@")
      ? { email: identifier }
      : { username: identifier };

    if (!identifier || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const user = await User.findOne(query);
    if (!user) return res.status(400).json({ error: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ error: "Invalid Password" });

    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({ token, username: user.username, email: user.email });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

// GET /api/me
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      (err, decoded) => {
        if (err)
          return res.status(401).json({ error: "Invalid or expired token" });
        return decoded;
      },
    );

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ username: user.username, email: user.email });
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
});

export default router;
