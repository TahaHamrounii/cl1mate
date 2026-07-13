const Hotel = require('../models/Hotel');
const SensorReading = require('../models/SensorReading');
const CollectionRecord = require('../models/CollectionRecord');

const seedHotelData = async (hotelId) => {
  try {
    // Check if there are already sensor readings
    const existingReadings = await SensorReading.findOne({ hotel: hotelId });
    if (existingReadings) {
      return; // Already seeded
    }

    const readings = [];
    const collections = [];
    const now = new Date();

    // Create 90 days of data
    for (let i = 89; i >= 0; i--) {
      const dayBase = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dayBase.setHours(0, 0, 0, 0);

      // Seasonal weight trend: higher in summer months (July, Aug), lower in winter
      const month = dayBase.getMonth(); // 0–11
      const seasonFactor = [0.6, 0.65, 0.7, 0.75, 0.85, 0.9, 1.0, 1.0, 0.9, 0.8, 0.7, 0.6][month];

      // Multiple readings throughout the day (morning, midday, evening)
      const readingTimes = [7, 12, 18];
      for (const hour of readingTimes) {
        const ts = new Date(dayBase.getTime() + hour * 3600 * 1000);

        // Weight grows through the day, drops after collection
        const baseWeight = Math.floor(seasonFactor * (200 + Math.random() * 600));
        const hourMultiplier = hour === 7 ? 0.4 : hour === 12 ? 0.7 : 1.0;
        const weight = Math.floor(baseWeight * hourMultiplier);

        // Organic matter quality: mostly high (92–99%), occasional dips
        const qualityDip = Math.random() < 0.15; // 15% chance of a dip day
        const organicMatter = qualityDip
          ? Math.floor(Math.random() * 6) + 88  // 88–93%
          : Math.floor(Math.random() * 7) + 93; // 93–99%

        readings.push({
          hotel: hotelId,
          weight,
          organicMatter,
          timestamp: ts,
        });
      }

      // Collection occurs every 3 days (at end of day)
      if (i % 3 === 0) {
        const collectionWeight = Math.floor(seasonFactor * (300 + Math.random() * 500));
        const organicMatter = Math.floor(Math.random() * 10) + 90; // 90–99%
        const isPnud = organicMatter >= 95;
        const redirectionReason = !isPnud
          ? (organicMatter < 90 ? 'low_quality' : collectionWeight < 100 ? 'low_quantity' : 'low_quality')
          : 'none';

        collections.push({
          hotel: hotelId,
          collector: isPnud ? 'pnud' : 'municipality',
          weight: collectionWeight,
          organicMatter,
          status: 'completed',
          redirectionReason,
          collectedAt: new Date(dayBase.getTime() + 20 * 3600 * 1000), // 8 PM
          scheduledDate: new Date(dayBase.getTime() + 20 * 3600 * 1000),
        });
      }
    }

    // Save to DB
    await SensorReading.insertMany(readings);
    await CollectionRecord.insertMany(collections);

    // Update Hotel current readings with last seeded data
    const lastReading = readings[readings.length - 1];
    await Hotel.findByIdAndUpdate(hotelId, {
      $set: {
        'sensors.weight': lastReading.weight,
        'sensors.organicMatter': lastReading.organicMatter,
        'sensors.status': 'online',
        'sensors.lastUpdated': lastReading.timestamp,
      },
    });

    console.log(`Successfully seeded ${readings.length} readings and ${collections.length} collections for hotel: ${hotelId}`);
  } catch (error) {
    console.error('Error seeding hotel telemetry:', error);
  }
};

module.exports = { seedHotelData };
