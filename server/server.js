// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// require("dotenv").config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import path from "path";

const app = express();
app.use(express.json());
app.use(cors());

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error", err));

app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Import routes in ES module style
import authRoutes from "./routes/authRoutes.js";
app.use("/api", authRoutes);

import favoritesRoutes from "./routes/favorites.js";
app.use("/api", favoritesRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
