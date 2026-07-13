const User = require('../models/User');
const Hotel = require('../models/Hotel');
const SystemConfig = require('../models/SystemConfig');
const CollectionRecord = require('../models/CollectionRecord');

/**
 * @desc    Get system global configs and telemetry status
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin role)
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalHotels = await Hotel.countDocuments({});
    
    // Count sensors by status
    const hotels = await Hotel.find({});
    const sensorStats = {
      online: 0,
      offline: 0,
      error: 0,
    };
    hotels.forEach((h) => {
      const status = h.sensors.status || 'online';
      sensorStats[status] = (sensorStats[status] || 0) + 1;
    });

    // Get configuration details
    let config = await SystemConfig.findOne().sort({ createdAt: -1 });
    if (!config) {
      config = await SystemConfig.create({
        minOrganicPercentage: 95,
        minWeightThreshold: 100,
        truckCapacityTons: 16.7,
      });
    }

    // Global collection stats
    const totalCollections = await CollectionRecord.countDocuments({ status: 'completed' });
    const collections = await CollectionRecord.find({ status: 'completed' });
    const totalWeightKg = collections.reduce((sum, c) => sum + c.weight, 0);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalHotels,
        sensorStats,
        config,
        collectionsSummary: {
          totalCollections,
          totalWeightTons: parseFloat((totalWeightKg / 1000).toFixed(2)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new system configuration (updates parameters)
 * @route   POST /api/admin/config
 * @access  Private (Admin role)
 */
const updateSystemConfig = async (req, res, next) => {
  try {
    const { minOrganicPercentage, minWeightThreshold, truckCapacityTons } = req.body;

    const config = await SystemConfig.create({
      minOrganicPercentage: minOrganicPercentage !== undefined ? Number(minOrganicPercentage) : 95,
      minWeightThreshold: minWeightThreshold !== undefined ? Number(minWeightThreshold) : 100,
      truckCapacityTons: truckCapacityTons !== undefined ? Number(truckCapacityTons) : 16.7,
      lastUpdatedBy: req.user._id,
    });

    res.json({
      success: true,
      message: 'System parameters updated successfully',
      data: config,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create/Register a hotel profile (requires creating a User first, or handles both)
 * @route   POST /api/admin/hotels
 * @access  Private (Admin role)
 */
const createHotelProfile = async (req, res, next) => {
  try {
    const { name, email, password, lat, lng, minWeightThreshold, phone } = req.body;

    if (!name || !email || !password || lat === undefined || lng === undefined) {
      res.status(400);
      return next(new Error('name, email, password, lat, and lng are required'));
    }

    // 1. Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      return next(new Error('User account already exists with this email'));
    }

    // 2. Create the User account with role 'hotel'
    const user = await User.create({
      name,
      email,
      password,
      role: 'hotel',
      phone,
    });

    // 3. Create the corresponding Hotel profile
    const hotel = await Hotel.create({
      user: user._id,
      name,
      location: {
        lat: Number(lat),
        lng: Number(lng),
      },
      config: {
        minWeightThreshold: minWeightThreshold !== undefined ? Number(minWeightThreshold) : 100,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Hotel user and profile created successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        hotel,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a hotel and its associated user account
 * @route   DELETE /api/admin/hotels/:id
 * @access  Private (Admin role)
 */
const deleteHotelProfile = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      res.status(404);
      return next(new Error('Hotel not found'));
    }

    // Delete associated user
    await User.findByIdAndDelete(hotel.user);

    // Delete hotel
    await Hotel.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Hotel and its user account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  updateSystemConfig,
  createHotelProfile,
  deleteHotelProfile,
};
