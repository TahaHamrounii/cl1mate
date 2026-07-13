const express = require('express');
const router = express.Router();
const {
  getHotelDashboard,
  getSensorHistory,
  getAllHotels,
} = require('../controllers/hotelController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Hotel-specific dashboard & sensor history
router.get('/my-dashboard', protect, authorizeRoles('hotel', 'admin'), getHotelDashboard);
router.get('/my-sensor-history', protect, authorizeRoles('hotel', 'admin'), getSensorHistory);

// Shared route to list all hotels for authorities
router.get('/', protect, authorizeRoles('pnud', 'municipality', 'admin', 'driver'), getAllHotels);

module.exports = router;
