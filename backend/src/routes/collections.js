const express = require('express');
const router = express.Router();
const {
  getOptimizedDailyRoutes,
  recordCollection,
  getPnudAnalytics,
  getMunicipalityAnalytics,
} = require('../controllers/collectionController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Get optimized routes (available to pnud, municipality, driver, and admin)
router.get(
  '/optimized-routes',
  protect,
  authorizeRoles('pnud', 'municipality', 'driver', 'admin'),
  getOptimizedDailyRoutes
);

// Record/save a specific collection action (typically done by driver or admin)
router.post(
  '/record',
  protect,
  authorizeRoles('driver', 'pnud', 'municipality', 'admin'),
  recordCollection
);

// Analytics endpoints
router.get(
  '/pnud-analytics',
  protect,
  authorizeRoles('pnud', 'admin'),
  getPnudAnalytics
);

router.get(
  '/municipality-analytics',
  protect,
  authorizeRoles('municipality', 'admin'),
  getMunicipalityAnalytics
);

module.exports = router;
