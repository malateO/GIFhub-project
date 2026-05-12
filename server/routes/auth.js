const express = require("express");
const User = require("../models/User");
const router = express.Router();

// POST /api/signup
router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body; // Step A: Get data from request
    const newUser = new User({ username, password }); // Step B: Create new user
    await newUser.save(); // Step C: Save to MongoDB
    res.status(201).send("User create successfully"); //Step D: Respond
  } catch (err) {
    res.status(400).send("Error creating user: " + err.message);
  }
});

module.exports = router;
