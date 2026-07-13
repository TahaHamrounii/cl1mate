const mongoose = require('mongoose');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const { seedHotelData } = require('./hotelSeeder');

const mongoUri = 'mongodb+srv://user1:user1user1@c0.e7o7vbv.mongodb.net/?appName=c0';

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Database connected successfully.');

    // 1. Find user tahah680@gmail.com
    const user = await User.findOne({ email: 'tahah680@gmail.com' });
    if (!user) {
      console.error('User tahah680@gmail.com not found!');
      process.exit(1);
    }

    // Ensure role is 'hotel'
    user.role = 'hotel';
    await user.save();
    console.log("User role updated/verified as 'hotel'.");

    // 2. Find or create Hotel profile
    let hotel = await Hotel.findOne({ user: user._id });
    if (!hotel) {
      hotel = await Hotel.create({
        user: user._id,
        name: 'Grand Tunis Hotel',
        address: 'Tunis, Tunisia',
        location: {
          lat: 36.8065,
          lng: 10.1815,
        },
      });
      console.log('Created new Hotel profile for user.');
    }

    // 3. Seed historical data
    // Remove any existing data to do a fresh seed
    const SensorReading = require('../models/SensorReading');
    const CollectionRecord = require('../models/CollectionRecord');
    await SensorReading.deleteMany({ hotel: hotel._id });
    await CollectionRecord.deleteMany({ hotel: hotel._id });
    console.log('Cleaned up existing hotel sensor/collection logs.');

    await seedHotelData(hotel._id);
    console.log('Data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running script:', error);
    process.exit(1);
  }
};

run();
