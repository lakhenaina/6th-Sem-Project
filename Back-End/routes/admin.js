import express from "express";
import Order from "../model/order_model.js";
import User from "../model/user_model.js";

const router = express.Router();

// ==========================
// GET all orders
// ==========================
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email phoneNumber")
      .populate("items.product", "title price");
    res.json({ data: orders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching orders" });
  }
});

// ==========================
// GET single order by ID
// ==========================
router.get("/orders/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phoneNumber")
      .populate("items.product", "title price");
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json({ data: order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==========================
// PATCH update order status
// ==========================
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: "Order status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Status update error" });
  }
});

// ==========================
// PATCH cancel order
// ==========================
router.patch("/orders/:id/cancel", async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, { status: "Cancelled" });
    res.json({ message: "Order cancelled" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Cancel error" });
  }
});

// ==========================
// GET all users (for admin panel)
// ==========================
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json({ success: true, data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching users" });
  }
});

// ==========================
// PATCH block/unblock user
// ==========================
router.patch("/users/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await User.findByIdAndUpdate(req.params.id, { status });
    res.json({ success: true, message: "User status updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Status update failed" });
  }
});

// ==========================
// DELETE user
// ==========================
router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});
// mark payment as received
// router.patch("/orders/:orderNumber/payment", async (req, res) => {
//   try {
//     await Order.findOneAndUpdate({ orderNumber: req.params.orderNumber }, { paymentStatus: "paid" });
//     res.json({ message: "Payment marked as received" });
//   } catch (err) {
//     console.error("markPayment error:", err);
//     res.status(500).json({ message: "Error updating payment status" });
//   }
// });
// mark payment as received
router.patch("/orders/:id/payment", async (req, res) => {
  try {
    console.log(`Trying to mark payment for order ID: ${req.params.id}`);

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: "paid" },
      { new: true }
    );

    console.log("Order after update:", order);

    if (!order) {
      console.log("Order not found");
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Payment marked as received", data: order });
  } catch (err) {
    console.error("Error updating payment status:", err);
    res.status(500).json({
      message: "Error updating payment status",
      error: err.message
    });
  }
});







export default router;
