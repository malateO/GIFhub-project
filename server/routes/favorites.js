const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const User = require("../models/User");

// Save GIF to favorites (POST)
router.post("/favorites", authenticateToken, async (req, res) => {
  try {
    const { gifId } = req.body;

    // Check if gifId was provided
    if (!gifId) {
      return res.status(400).json({ error: "gifId required" });
    }

    // Find the logged-in user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add gifId if not already in favorites
    if (!user.favorites.includes(gifId)) {
      user.favorites.push(gifId);
      await user.save();
    }

    res.json({ message: "GIF added to favorites", favorites: user.favorites });
  } catch (err) {
    console.error("Error saving favorite:", err); // helpful for debugging
    res.status(500).json({ error: "Server error" });
  }
});

// Get favorites (GET)
router.get("/favorites", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ favorites: user.favorites });
  } catch (err) {
    console.error("Error retrieving favorites:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Remove GIF from favorites (DELETE)
router.delete("/favorites/:gifId", authenticateToken, async (req, res) => {
  try {
    const { gifId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.favorites = user.favorites.filter((id) => id !== gifId);
    await user.save();

    res.json({
      message: "GIF removed from favorites",
      favorites: user.favorites,
    });
  } catch (err) {
    console.error("Error removing favorite:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
