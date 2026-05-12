const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const dotenv     = require('dotenv');

const ordersRouter    = require('./routes/orders.js');
const productsRouter  = require('./routes/products.js');
const analyticsRouter = require('./routes/analytics.js');

dotenv.config();

const app = express();

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Nexus Backend API is running! ✅' });
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.CLIENT_URL,
  ],
  credentials: true
}));
app.use(express.json());

// DB Connection
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB error:', err);
    throw err;
  }
}

// DB Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Routes
app.use('/api/orders',    ordersRouter);
app.use('/api/products',  productsRouter);
app.use('/api/analytics', analyticsRouter);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.url} not found` });
});

// Error Handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Local dev only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

module.exports = app;