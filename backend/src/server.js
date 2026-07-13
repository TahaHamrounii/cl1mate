const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to MongoDB database
connectDB();

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());

// HTTP request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// API Routes import
const authRoutes = require('./routes/auth');
const hotelRoutes = require('./routes/hotels');
const sensorRoutes = require('./routes/sensors');
const collectionRoutes = require('./routes/collections');
const adminRoutes = require('./routes/admin');

// API Routes registration
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/collections', collectionRoutes);
app.use('/api/admin', adminRoutes);

// Base Route for service checks
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Organic Waste Collection Management System API is running',
    timestamp: new Date(),
  });
});

// Centralized error handling
app.use(errorHandler);

// Set Port and start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
