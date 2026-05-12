import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  customer: { type: String, required: true },
  product:  { type: String, required: true },
  emoji:    { type: String, default: "🛒" },
  amount:   { type: Number, required: true },
  qty:      { type: Number, default: 1 },
  status: {
    type: String,
    enum: ["Delivered","Processing","Shipped","Cancelled","Refunded"],
    default: "Processing",
  },
  userId: { type: String },
}, { timestamps: true });

// ✅ Only ONE export default
export default mongoose.model("Order", orderSchema);