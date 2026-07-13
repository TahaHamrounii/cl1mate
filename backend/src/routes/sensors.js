const express = require('express');
const router = express.Router();
const {
  updateSensorData,
  simulateAllSensors,
} = require('../controllers/sensorController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Endpoint for simulated devices (usually a simple IoT endpoint without heavy auth for sandbox purposes, or protected by simple API key)
router.post('/update', updateSensorData);

// Admin-only trigger to randomize all sensors for testing dashboard flow
router.post('/simulate-all', protect, authorizeRoles('admin'), simulateAllSensors);

module.exports = router;
