const User = require('../models/User');
const Hotel = require('../models/Hotel');
const SystemConfig = require('../models/SystemConfig');
const CollectionRecord = require('../models/CollectionRecord');
const SensorReading = require('../models/SensorReading');
const { seedHotelData } = require('../utils/hotelSeeder');

/**
 * @desc    Get system global configs, users, hotels, collections, and stats
 * @route   GET /api/admin/dashboard
 * @access  Private (Admin role)
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const hotels = await Hotel.find({}).populate('user');
    
    // Seed any hotels that do not have sensor readings seeded yet (ensures recent collections exist)
    for (const hotel of hotels) {
      const readingCount = await SensorReading.countDocuments({ hotel: hotel._id });
      if (readingCount === 0) {
        await seedHotelData(hotel._id);
      }
    }
    
    // Count sensors by status
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
    let config = await SystemConfig.findOne().sort({ createdAt: -1 }).populate('activeDriver');
    if (!config) {
      config = await SystemConfig.create({
        minOrganicPercentage: 95,
        minWeightThreshold: 100,
        truckCapacityTons: 16.7,
      });
    }

    // Global collection stats
    const totalCollections = await CollectionRecord.countDocuments({ status: 'completed' });
    const collections = await CollectionRecord.find({}).populate('hotel');
    const totalWeightKg = collections.filter(c => c.status === 'completed').reduce((sum, c) => sum + c.weight, 0);

    res.json({
      success: true,
      data: {
        users,
        hotels,
        sensorStats,
        config,
        collectionsSummary: {
          totalCollections,
          totalWeightTons: parseFloat((totalWeightKg / 1000).toFixed(2)),
          collections,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create/Update system configuration (updates parameters and active driver)
 * @route   POST /api/admin/config
 * @access  Private (Admin role)
 */
const updateSystemConfig = async (req, res, next) => {
  try {
    const { minOrganicPercentage, minWeightThreshold, truckCapacityTons, activeDriver } = req.body;

    const config = await SystemConfig.create({
      minOrganicPercentage: minOrganicPercentage !== undefined ? Number(minOrganicPercentage) : 95,
      minWeightThreshold: minWeightThreshold !== undefined ? Number(minWeightThreshold) : 100,
      truckCapacityTons: truckCapacityTons !== undefined ? Number(truckCapacityTons) : 16.7,
      activeDriver: activeDriver || undefined,
      lastUpdatedBy: req.user._id,
    });

    const populatedConfig = await SystemConfig.findById(config._id).populate('activeDriver');

    res.json({
      success: true,
      message: 'System parameters updated successfully',
      data: populatedConfig,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create/Register a hotel profile
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

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      return next(new Error('User account already exists with this email'));
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'hotel',
      status: 'active',
      phone,
    });

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

    // Seed telemetry data and collections history for the new hotel
    await seedHotelData(hotel._id);

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

    await User.findByIdAndDelete(hotel.user);
    await Hotel.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Hotel and its user account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all users list
 * @route   GET /api/admin/users
 * @access  Private (Admin role)
 */
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user account activation status
 * @route   PUT /api/admin/users/:id/status
 * @access  Private (Admin role)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'active', 'rejected'].includes(status)) {
      res.status(400);
      return next(new Error('Invalid status'));
    }

    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    if (!user) {
      res.status(404);
      return next(new Error('User not found'));
    }

    res.json({ success: true, message: `User account status updated to ${status}`, data: user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Associate a registered hotel user to a new Hotel profile
 * @route   POST /api/admin/associate-hotel
 * @access  Private (Admin role)
 */
const associateHotelUser = async (req, res, next) => {
  try {
    const { userId, name, lat, lng, minWeightThreshold } = req.body;

    if (!userId || !name || lat === undefined || lng === undefined) {
      res.status(400);
      return next(new Error('userId, name, lat, and lng are required'));
    }

    const user = await User.findById(userId);
    if (!user || user.role !== 'hotel') {
      res.status(400);
      return next(new Error('Valid hotel user not found'));
    }

    const existingProfile = await Hotel.findOne({ user: userId });
    if (existingProfile) {
      res.status(400);
      return next(new Error('Hotel profile already exists for this user'));
    }

    const hotel = await Hotel.create({
      user: userId,
      name,
      location: {
        lat: Number(lat),
        lng: Number(lng),
      },
      config: {
        minWeightThreshold: minWeightThreshold !== undefined ? Number(minWeightThreshold) : 100,
      },
    });

    user.status = 'active';
    await user.save();

    // Seed telemetry data and collections history for the associated hotel
    await seedHotelData(hotel._id);

    res.json({
      success: true,
      message: 'Hotel user activated and associated successfully',
      data: hotel,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard metrics for a specific hotel (For Admin eye icon)
 * @route   GET /api/admin/hotels/:id/dashboard
 * @access  Private (Admin role)
 */
const getHotelDashboardForAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const hotel = await Hotel.findById(id).populate('user');
    if (!hotel) {
      res.status(404);
      return next(new Error('Hotel profile not found'));
    }

    const collectionHistory = await CollectionRecord.find({
      hotel: id,
      status: 'completed',
    }).sort({ collectedAt: -1 });

    const totalCollected = collectionHistory.reduce((sum, record) => sum + record.weight, 0);

    const upcomingCollections = await CollectionRecord.find({
      hotel: id,
      status: 'pending',
    }).sort({ scheduledDate: 1 });

    const currentYear = new Date().getFullYear();
    const monthlyStats = Array(12).fill(0);
    collectionHistory.forEach((record) => {
      const date = new Date(record.collectedAt || record.updatedAt);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth();
        monthlyStats[month] += record.weight;
      }
    });

    const sensorHistory = await SensorReading.find({ hotel: id })
      .sort({ timestamp: -1 })
      .limit(300);

    res.json({
      success: true,
      data: {
        hotel,
        metrics: {
          totalCollected,
          totalPickups: collectionHistory.length,
          upcomingPickupsCount: upcomingCollections.length,
        },
        upcomingCollections,
        history: collectionHistory.slice(0, 10),
        sensorHistory: sensorHistory.reverse(),
        monthlyStats,
      },
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
  getUsers,
  updateUserStatus,
  associateHotelUser,
  getHotelDashboardForAdmin,
};
