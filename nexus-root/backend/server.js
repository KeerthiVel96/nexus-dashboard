import express    from "express";
import mongoose   from "mongoose";
import cors       from "cors";
import helmet     from "helmet";
import dotenv     from "dotenv";

import ordersRouter    from "./routes/orders.js";
import productsRouter  from "./routes/products.js";
import analyticsRouter from "./routes/analytics.js";

dotenv.config();

const app = express();

app.get("/", (req, res) => {
  res.json({ message: "Nexus Backend API is running! ✅" });
});

app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", process.env.CLIENT_URL],
  credentials: true,
}));
app.use(express.json());

let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGODB_URI, { bufferCommands: false });
  isConnected = true;
}

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

app.use("/api/orders",    ordersRouter);
app.use("/api/products",  productsRouter);
app.use("/api/analytics", analyticsRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.url} not found` });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

export default app;