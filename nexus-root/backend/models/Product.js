import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  category: { type: String, required: true },
  emoji:    { type: String, default: "📦" },
  price:    { type: Number, required: true },
  stock:    { type: Number, default: 0 },
  sold:     { type: Number, default: 0 },
  revenue:  { type: Number, default: 0 },
  rating:   { type: Number, default: 0 },
  trend:    { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);