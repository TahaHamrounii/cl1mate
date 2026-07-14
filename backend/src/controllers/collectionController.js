const Hotel = require('../models/Hotel');
const CollectionRecord = require('../models/CollectionRecord');
const SystemConfig = require('../models/SystemConfig');
const { optimizeRoutes } = require('../utils/routeOptimizer');

/**
 * @desc    Get optimized daily routes for PNUD (truck capacity constraint) and Municipality
 * @route   GET /api/collections/optimized-routes
 * @access  Private (PNUD, Municipality, Admin, Driver roles)
 */
const getOptimizedDailyRoutes = async (req, res, next) => {
  try {
    // 1. Fetch system configurations
    let config = await SystemConfig.findOne().sort({ createdAt: -1 }).populate('activeDriver');
    if (!config) {
      // Default configurations if none created in DB yet
      config = await SystemConfig.create({
        truckCapacityTons: 16.7,
        minWeightThreshold: 100,
        minOrganicPercentage: 95,
      });
    }

    // 1.5 Enforce active driver restriction
    if (req.user.role === 'driver' && config.activeDriver) {
      const activeDriverId = config.activeDriver._id || config.activeDriver;
      if (activeDriverId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          code: 'NOT_ACTIVE_DRIVER',
          message: 'You are not today\'s active collection driver. Access denied.',
        });
      }
    }

    // 2. Fetch all hotels with their current real-time sensor readings
    const hotels = await Hotel.find({});

    // 3. Fetch completed collections for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const completedToday = await CollectionRecord.find({
      status: 'completed',
      collectedAt: { $gte: startOfToday },
    });

    // 4. Optimize routes using the utility helper
    // Depot is set in Djerba (default)
    const routes = optimizeRoutes(hotels, config);

    res.json({
      success: true,
      data: {
        config: {
          truckCapacityTons: config.truckCapacityTons,
          minWeightThreshold: config.minWeightThreshold,
          minOrganicPercentage: config.minOrganicPercentage,
          activeDriver: config.activeDriver,
        },
        pnud: routes.pnud,
        municipality: routes.municipality,
        completedToday,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Record/Update a hotel's waste collection status
 * @route   POST /api/collections/record
 * @access  Private (Driver, PNUD, Municipality, Admin roles)
 */
const recordCollection = async (req, res, next) => {
  try {
    const { hotelId, collector, weight, organicMatter, status, redirectionReason } = req.body;

    if (!hotelId || !collector || weight === undefined || organicMatter === undefined) {
      res.status(400);
      return next(new Error('hotelId, collector, weight, and organicMatter are required'));
    }

    // Record the collection
    const record = await CollectionRecord.create({
      hotel: hotelId,
      collector,
      driver: req.user._id, // Assumes the driver/operator is logged in
      weight: Number(weight),
      organicMatter: Number(organicMatter),
      status: status || 'completed',
      redirectionReason: redirectionReason || 'none',
      collectedAt: new Date(),
    });

    // Reset hotel sensor readings after collection has been completed
    if (status === 'completed') {
      const hotel = await Hotel.findById(hotelId);
      if (hotel) {
        hotel.sensors.weight = 0; // Empty the collection bin
        hotel.sensors.lastUpdated = new Date();
        await hotel.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Collection recorded successfully',
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard analytics for PNUD (methanization facility logs)
 * @route   GET /api/collections/pnud-analytics
 * @access  Private (PNUD, Admin roles)
 */
const getPnudAnalytics = async (req, res, next) => {
  try {
    // Total collected today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayRecords = await CollectionRecord.find({
      collector: 'pnud',
      status: 'completed',
      collectedAt: { $gte: startOfToday, $lte: endOfToday },
    });

    const totalCollectedTodayKg = todayRecords.reduce((sum, r) => sum + r.weight, 0);

    // Get configuration for truck capacity limit
    let config = await SystemConfig.findOne().sort({ createdAt: -1 });
    const truckCapacityKg = (config ? config.truckCapacityTons : 16.7) * 1000;

    // Quality stats (Average organic matter percentage collected today)
    const avgOrganicToday =
      todayRecords.length > 0
        ? todayRecords.reduce((sum, r) => sum + r.organicMatter, 0) / todayRecords.length
        : 0;

    // Historical analytics (e.g. cumulative load over the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentRecords = await CollectionRecord.find({
      collector: 'pnud',
      status: 'completed',
      collectedAt: { $gte: thirtyDaysAgo },
    }).populate('hotel', 'name');

    res.json({
      success: true,
      data: {
        today: {
          totalCollectedKg: totalCollectedTodayKg,
          truckCapacityKg: truckCapacityKg,
          remainingCapacityKg: Math.max(0, truckCapacityKg - totalCollectedTodayKg),
          stopsCompleted: todayRecords.length,
          averageOrganicPercentage: parseFloat(avgOrganicToday.toFixed(2)),
        },
        historical: recentRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard analytics for Municipality
 * @route   GET /api/collections/municipality-analytics
 * @access  Private (Municipality, Admin roles)
 */
const getMunicipalityAnalytics = async (req, res, next) => {
  try {
    // Find all collections handled by municipality
    const records = await CollectionRecord.find({
      collector: 'municipality',
    })
      .populate('hotel', 'name location')
      .sort({ createdAt: -1 });

    // Filter today's redirected hotels count
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const redirectStats = await CollectionRecord.aggregate([
      {
        $match: {
          collector: 'municipality',
          createdAt: { $gte: startOfToday, $lte: endOfToday },
        },
      },
      {
        $group: {
          _id: '$redirectionReason',
          count: { $sum: 1 },
          totalWeight: { $sum: '$weight' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        history: records,
        todayRedirectionStats: redirectStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOptimizedDailyRoutes,
  recordCollection,
  getPnudAnalytics,
  getMunicipalityAnalytics,
};
