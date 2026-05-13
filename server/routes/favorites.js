const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

router.get("/favorites", authenticateToken, (req, res) => {
  res.json({
    message: `Welcome ${req.user.username}, here are your favorites!`,
  });
});

module.exports = router;
