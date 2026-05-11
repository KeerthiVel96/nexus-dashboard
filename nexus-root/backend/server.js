import express  from "express";
import mongoose from "mongoose";
import cors     from "cors";
import helmet   from "helmet";
import dotenv   from "dotenv";

dotenv.config();

const app = express();

app.use(helmet());
app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:5173",
    process.env.CLIENT_URL || "",
  ].filter(Boolean),
  credentials: true,
}));

// ── Health check — NO DB needed, shows env status ──
app.get("/api/health", (req, res) => {
  res.json({
    status:  "ok",
    mongoUri: process.env.MONGODB_URI
      ? process.env.MONGODB_URI.slice(0, 40) + "..."
      : "MISSING",
    firebaseId:    process.env.FIREBASE_PROJECT_ID   || "MISSING",
    firebaseEmail: process.env.FIREBASE_CLIENT_EMAIL || "MISSING",
    firebaseKey:   process.env.FIREBASE_PRIVATE_KEY  ? "SET" : "MISSING",
    clientUrl:     process.env.CLIENT_URL            || "MISSING",
  });
});

// ── MongoDB cached connection ──────────────────────
let cached = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI env var is missing");
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands:            false,
      serverSelectionTimeoutMS:  8000,
      socketTimeoutMS:           8000,
    }).catch(err => {
      cached.promise = null;
      throw err;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// ── DB test endpoint ──────────────────────────────
app.get("/api/dbtest", async (req, res) => {
  try {
    await connectDB();
    res.json({ status: "ok", mongo: "connected" });
  } catch (err) {
    res.status(500).json({
      error:   "DB failed",
      message: err.message,
      code:    err.code || "none",
    });
  }
});

// ── Connect DB before all other routes ────────────
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({
      error:   "Database connection failed",
      message: err.message,
    });
  }
});

// ── API Routes ─────────────────────────────────────
try {
  const { default: ordersRouter }    = await import("./routes/orders.js");
  const { default: productsRouter }  = await import("./routes/products.js");
  const { default: analyticsRouter } = await import("./routes/analytics.js");
  app.use("/api/orders",    ordersRouter);
  app.use("/api/products",  productsRouter);
  app.use("/api/analytics", analyticsRouter);
} catch (err) {
  console.error("Route load error:", err.message);
}

app.use((req, res) => {
  res.status(404).json({ error: `${req.method} ${req.url} not found` });
});

app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

export default app;