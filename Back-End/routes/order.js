import express from "express";
import Order from "../model/order_model.js";  // use correct path
// import verifyToken if you want authentication
const router = express.Router();

// place order
router.post("/", async (req, res) => {
    try {
        const { items, total, paymentMethod, userId, deliveryDetails } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: "No items in order" });
        }

        const order = new Order({
            user: userId,
            items,
            total,
            paymentMethod,
            paymentStatus: paymentMethod === "COD" ? "pending" : "pending",
            deliveryDetails // this stores everything
        });

        await order.save();
        res.status(201).json({ success: true, message: "Order placed successfully", order });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error placing order" });
    }
});

// PATCH update payment status
router.patch("/:id", async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    if (!paymentStatus) {
      return res.status(400).json({ message: "Missing paymentStatus" });
    }
    const updated = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    );
    res.json({ success: true, updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
