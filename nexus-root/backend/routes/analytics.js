import { Router } from "express";
import Order from "../models/order.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.get("/revenue", verifyToken, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        revenue: { $sum: "$amount" },
        orders:  { $sum: 1 },
      }},
      { $sort: { _id: 1 } },
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/categories", verifyToken, async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $unwind: "$items" },
      { $group: {
        _id: "$items.category",
        revenue: { $sum: "$items.price" }
      }},
      { $sort: { revenue: -1 } }
    ]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
export default router;