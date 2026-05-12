const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error", err));

app.get("/", (req, res) => {
  res.send("Backend is running");
});

const authRoutes = require("./routes/auth");
app.use("/api", authRoutes);

app.listen(5000, () => console.log("✅ Server running or port 5000"));
