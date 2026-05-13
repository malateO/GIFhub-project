const bcrypt = require("bcrypt");
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// POST /api/signup
router.post("/signup", async (req, res) => {
  try {
    const { username, password, email } = req.body; // Step A: Get data from request

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ username, email, password: hashedPassword }); // Step B: Create new user

    await newUser.save(); // Step C: Save to MongoDB
    res.status(201).send("User created successfully with hashed password"); //Step D: Respond
  } catch (err) {
    if (err.code === 1100) {
      // Duplicate key error (username or email already exists)
      return res
        .status(400)
        .json({ error: "Username or email already exists" });
    }
    res.status(400).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) return res.status(400).send("User not found");

    // Compare plain password with hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json({ error: "Invalid Password" });

    //Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    res.json({ message: "Login Successful", token });
  } catch (err) {
    res.status(500).json({ error: "Server error: " + err.message });
  }
});

module.exports = router;
