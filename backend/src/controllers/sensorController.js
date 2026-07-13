const Hotel = require('../models/Hotel');
const SensorReading = require('../models/SensorReading');

/**
 * @desc    Simulate telemetry update from a hotel's weight and organic matter sensors
 * @route   POST /api/sensors/update
 * @access  Public (Simulating IoT sensor API payload)
 */
const updateSensorData = async (req, res, next) => {
  try {
    const { hotelId, weight, organicMatter, status } = req.body;

    if (!hotelId || weight === undefined || organicMatter === undefined) {
      res.status(400);
      return next(new Error('hotelId, weight, and organicMatter are required'));
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      res.status(404);
      return next(new Error('Hotel not found'));
    }

    // Update Hotel current readings
    hotel.sensors.weight = Number(weight);
    hotel.sensors.organicMatter = Number(organicMatter);
    if (status) {
      hotel.sensors.status = status;
    }
    hotel.sensors.lastUpdated = new Date();
    await hotel.save();

    // Log the reading in history
    const reading = await SensorReading.create({
      hotel: hotelId,
      weight: Number(weight),
      organicMatter: Number(organicMatter),
    });

    res.status(200).json({
      success: true,
      message: 'Telemetry data processed successfully',
      data: {
        hotelId,
        currentWeight: hotel.sensors.weight,
        currentOrganicMatter: hotel.sensors.organicMatter,
        status: hotel.sensors.status,
        loggedReading: reading._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Simulate bulk random updates for testing purposes
 * @route   POST /api/sensors/simulate-all
 * @access  Private (Admin role)
 */
const simulateAllSensors = async (req, res, next) => {
  try {
    const hotels = await Hotel.find({});
    const updatedCount = [];

    for (const hotel of hotels) {
      // Simulate normal daily fluctuations
      // Weight: 50kg to 1200kg
      const randWeight = Math.floor(Math.random() * 1150) + 50;
      // Organic: 90% to 100%
      const randOrganic = Math.floor(Math.random() * 11) + 90;
      
      hotel.sensors.weight = randWeight;
      hotel.sensors.organicMatter = randOrganic;
      hotel.sensors.status = 'online';
      hotel.sensors.lastUpdated = new Date();
      await hotel.save();

      await SensorReading.create({
        hotel: hotel._id,
        weight: randWeight,
        organicMatter: randOrganic,
      });

      updatedCount.push({
        hotel: hotel.name,
        weight: randWeight,
        organicMatter: randOrganic,
      });
    }

    res.json({
      success: true,
      message: `Simulated telemetry updates for ${hotels.length} hotels`,
      data: updatedCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateSensorData,
  simulateAllSensors,
};
