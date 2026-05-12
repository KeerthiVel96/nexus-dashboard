import express     from "express";
import mongoose    from "mongoose";
import cors        from "cors";
import helmet      from "helmet";
import dotenv      from "dotenv";

import ordersRouter    from "./routes/orders.js";
import productsRouter  from "./routes/products.js";
import analyticsRouter from "./routes/analytics.js";

dotenv.config();

const app = express();

// ── Middleware ──────────────────────────────────────────────
// Health check route
app.get("/", (req, res) => {
  res.json({ message: "Nexus Backend API is running!" });
});
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.CLIENT_URL,
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());

// ── MongoDB — cached connection for serverless ──────────────
let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB error:", err);
    throw err;
  }
}

// ── Middleware to ensure DB is connected on every request ───
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ── Routes ──────────────────────────────────────────────────
app.use("/api/orders",    ordersRouter);
app.use("/api/products",  productsRouter);
app.use("/api/analytics", analyticsRouter);

app.get("/api/health", (_, res) => {
  res.json({ status: "ok", connected: isConnected });
});

// ── 404 handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.url} not found` });
});

// ── Global error handler ─────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

// ── IMPORTANT: Export for Vercel — NO app.listen() ──────────
export default app;


// ✅ Add this at the bottom of server.js
module.exports = app; // for Vercel serverless

// Keep this for local dev
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}