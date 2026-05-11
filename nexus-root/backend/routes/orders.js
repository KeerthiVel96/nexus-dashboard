import { Router } from "express";
import Order from "../models/Order.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

// GET all orders (protected)
router.get("/", verifyToken, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(50);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET order stats
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const [total, processing, shipped, cancelled] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "Processing" }),
      Order.countDocuments({ status: "Shipped"    }),
      Order.countDocuments({ status: "Cancelled"  }),
    ]);
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    res.json({
      total, processing, shipped, cancelled,
      revenue: revenueAgg[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create order (protected)
router.post("/", verifyToken, async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, userId: req.user.uid });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH update status (protected)
router.patch("/:id", verifyToken, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;