import mongoose from "mongoose";

// Step A: Define the shape of your data
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  favorites: [
    {
      id: { type: String, required: true },
      title: { type: String },
      images: { type: Object },
    },
  ],
});

// Step B. Turn Schema into a model
const User = mongoose.model("User", userSchema);

// Step C: Export it so routes can use it
export default User;
