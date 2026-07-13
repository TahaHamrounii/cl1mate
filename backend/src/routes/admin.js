const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  updateSystemConfig,
  createHotelProfile,
  deleteHotelProfile,
  getUsers,
  updateUserStatus,
  associateHotelUser,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Apply admin protection to all routes in this file
router.use(protect);
router.use(authorizeRoles('admin'));

// Admin Dashboard & System Configs
router.get('/dashboard', getAdminDashboard);
router.post('/config', updateSystemConfig);

// Admin User management APIs
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.post('/associate-hotel', associateHotelUser);

// Admin Hotel profiles CRUD
router.post('/hotels', createHotelProfile);
router.delete('/hotels/:id', deleteHotelProfile);

module.exports = router;
