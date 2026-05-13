const mongoose = require("mongoose");

//  Step A: Define the shape of your data
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
});

// Step B. Turn Schema into a model
const User = mongoose.model("User", userSchema);

// Step C: Export it so routes can use it
module.exports = User;
