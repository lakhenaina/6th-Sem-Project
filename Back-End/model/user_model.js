import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phoneNumber: String,
  role: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  status: {
    type: String,
    enum: ['Active', 'Blocked'],
    default: 'Active'
  }
});

export default mongoose.model("User", userSchema);
