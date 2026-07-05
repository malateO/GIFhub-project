import express from "express";
import fetch from "node-fetch";
import authenticateToken from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

// Save GIF to favorites (POST)
router.post("/favorites", authenticateToken, async (req, res) => {
  try {
    const { gifId, title, images } = req.body;

    // Check if gifId was provided
    if (!gifId) {
      return res.status(400).json({ error: "gifId required" });
    }

    const favorite = {
      id: gifId,
      title,
      images,
    };

    // Find the logged-in user
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Add gifId if not already in favorites
    const exists =
      Array.isArray(user.favorites) &&
      user.favorites.some((fav) =>
        typeof fav === "string" ? fav === gifId : fav?.id === gifId,
      );

    if (!exists) {
      user.favorites.push(favorite);
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
    if (!user) return res.status(404).json({ error: "User not found" });

    // Fetch full GIF objects from GIPHY API
    const gifDetails = await Promise.all(
      user.favorites.map(async (fav) => {
        if (typeof fav === "string") {
          const response = await fetch(
            `https://api.giphy.com/v1/gifs/${fav}?api_key=${process.env.GIPHY_KEY}`,
          );
          const data = await response.json();
          return data.data;
        } else {
          return fav; // already full object
        }
      }),
    );

    res.json({ favorites: gifDetails });
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

    if (!user) return res.status(404).json({ error: "User not found" });

    user.favorites = user.favorites.filter((fav) =>
      typeof fav === "string" ? fav !== gifId : fav?.id !== gifId,
    );

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

export default router;
