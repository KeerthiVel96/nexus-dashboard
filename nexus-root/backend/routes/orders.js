import { Router } from "express";
import Order from "../models/order.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats", verifyToken, async (req, res) => {
  try {
    const [total, processing, shipped, cancelled] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped" }),
      Order.countDocuments({ status: "Cancelled" }),
    ]);
    res.json({ total, processing, shipped, cancelled });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;