import { Router } from "express";
import Product from "../models/Product.js";
import { verifyToken } from "../middleware/auth.js";

const router = Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const products = await Product.find().sort({ revenue: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", verifyToken, async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;