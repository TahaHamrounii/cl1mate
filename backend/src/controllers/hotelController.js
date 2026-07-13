const Hotel = require('../models/Hotel');
const CollectionRecord = require('../models/CollectionRecord');
const SensorReading = require('../models/SensorReading');
const { seedHotelData } = require('../utils/hotelSeeder');

/**
 * @desc    Get dashboard metrics for currently logged-in hotel
 * @route   GET /api/hotels/my-dashboard
 * @access  Private (Hotel role)
 */
const getHotelDashboard = async (req, res, next) => {
  try {
    // Find hotel record linked to this user
    const hotel = await Hotel.findOne({ user: req.user._id });
    if (!hotel) {
      res.status(404);
      return next(new Error('Hotel profile not found for this user'));
    }

    // Auto-seed historical telemetry & collection logs if empty
    await seedHotelData(hotel._id);

    // Refresh hotel instance to pick up the updated seeded current sensors values
    const updatedHotel = await Hotel.findById(hotel._id);

    // Get total waste collected
    const collectionHistory = await CollectionRecord.find({
      hotel: hotel._id,
      status: 'completed',
    }).sort({ collectedAt: -1 });

    const totalCollected = collectionHistory.reduce((sum, record) => sum + record.weight, 0);

    // Get upcoming collections
    const upcomingCollections = await CollectionRecord.find({
      hotel: hotel._id,
      status: 'pending',
    }).sort({ scheduledDate: 1 });

    // Calculate monthly statistics for this year
    const currentYear = new Date().getFullYear();
    const monthlyStats = Array(12).fill(0);
    
    collectionHistory.forEach((record) => {
      const date = new Date(record.collectedAt || record.updatedAt);
      if (date.getFullYear() === currentYear) {
        const month = date.getMonth(); // 0-11
        monthlyStats[month] += record.weight;
      }
    });

    res.json({
      success: true,
      data: {
        hotel: updatedHotel,
        metrics: {
          totalCollected,
          totalPickups: collectionHistory.length,
          upcomingPickupsCount: upcomingCollections.length,
        },
        upcomingCollections,
        history: collectionHistory.slice(0, 10), // return last 10 records
        monthlyStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get historical sensor readings for charts
 * @route   GET /api/hotels/my-sensor-history
 * @access  Private (Hotel role)
 */
const getSensorHistory = async (req, res, next) => {
  try {
    const hotel = await Hotel.findOne({ user: req.user._id });
    if (!hotel) {
      res.status(404);
      return next(new Error('Hotel profile not found'));
    }

    const limit = parseInt(req.query.limit) || 300;

    const readings = await SensorReading.find({ hotel: hotel._id })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: readings.reverse(), // chronologically ordered for plotting
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all hotels (For PNUD, Municipality, and Admin dashboards)
 * @route   GET /api/hotels
 * @access  Private (Admin, PNUD, Municipality roles)
 */
const getAllHotels = async (req, res, next) => {
  try {
    const hotels = await Hotel.find().populate('user', 'name email phone');
    res.json({
      success: true,
      data: hotels,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getHotelDashboard,
  getSensorHistory,
  getAllHotels,
};
