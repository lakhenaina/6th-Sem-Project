import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: Number,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false
  },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true }
    }
  ],
  total: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['COD', 'Khalti', 'eSewa'], default: 'COD' },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  status: { type: String, enum: ['Pending', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now },
  deliveryDetails: {
    senderName: String,
    senderPhone: String,
    senderEmail: String,
    deliveryLocation: String,
    receiverContact1: String,
    receiverContact2: String,
    deliveryDate: String,
    deliveryTimeSlot: String,
    orderNotes: String
  }
});

export default mongoose.model("Order", orderSchema);
