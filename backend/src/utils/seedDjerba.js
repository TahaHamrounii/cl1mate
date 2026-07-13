const mongoose = require('mongoose');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const SensorReading = require('../models/SensorReading');
const CollectionRecord = require('../models/CollectionRecord');

const mongoUri = 'mongodb+srv://user1:user1user1@c0.e7o7vbv.mongodb.net/?appName=c0';

const djerbaHotelsData = [
  {
    name: 'Hasdrubal Thalassa & Spa Djerba',
    email: 'hasdrubal@djerbahotels.com',
    lat: 33.8242,
    lng: 11.0125,
    weight: 450,
    organicMatter: 98,
  },
  {
    name: 'Radisson Blu Ulysse Resort',
    email: 'radissonblu@djerbahotels.com',
    lat: 33.8710,
    lng: 10.9780,
    weight: 950,
    organicMatter: 97,
  },
  {
    name: 'Iberostar Mehari Djerba',
    email: 'iberostar@djerbahotels.com',
    lat: 33.8291,
    lng: 11.0254,
    weight: 120,
    organicMatter: 96,
  },
  {
    name: 'Royal Garden Palace',
    email: 'royalgarden@djerbahotels.com',
    lat: 33.8188,
    lng: 11.0392,
    weight: 80, // Below min weight (100kg) -> Should be Municipality
    organicMatter: 98,
  },
  {
    name: 'TUI BLUE Palm Beach Palace',
    email: 'tuiblue@djerbahotels.com',
    lat: 33.8655,
    lng: 10.9888,
    weight: 1100,
    organicMatter: 92, // Below organic quality (95%) -> Should be Municipality
  },
  {
    name: 'Djerba Plaza Thalasso & Spa',
    email: 'djerbaplaza@djerbahotels.com',
    lat: 33.8222,
    lng: 11.0200,
    weight: 600,
    organicMatter: 99,
  },
  {
    name: 'Yati Beach Hotel',
    email: 'yatibeach@djerbahotels.com',
    lat: 33.8050,
    lng: 11.0450,
    weight: 750,
    organicMatter: 96,
  },
  {
    name: 'Fiesta Beach Djerba',
    email: 'fiestabeach@djerbahotels.com',
    lat: 33.8433,
    lng: 11.0022,
    weight: 50, // Below weight -> Municipality
    organicMatter: 91, // Below quality -> Municipality
  },
  {
    name: 'Seabel Rym Beach',
    email: 'seabelrym@djerbahotels.com',
    lat: 33.8122,
    lng: 11.0415,
    weight: 850,
    organicMatter: 97,
  },
  {
    name: 'El Mouradi Djerba Menzel',
    email: 'elmouradi@djerbahotels.com',
    lat: 33.7915,
    lng: 11.0550,
    weight: 1300,
    organicMatter: 98,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Keep existing admin, driver, etc. But clean up existing hotel accounts and their profiles
    // Find all users with email ending in @djerbahotels.com and delete them
    const existingDjerbaEmails = djerbaHotelsData.map((h) => h.email);
    await User.deleteMany({ email: { $in: existingDjerbaEmails } });
    
    // We should also delete the Grand Tunis Hotel user if it's there, to keep exactly 10 Djerba hotels
    await User.deleteMany({ email: 'tahah680@gmail.com' });
    
    // Clean all hotels, readings, and collections
    await Hotel.deleteMany({});
    await SensorReading.deleteMany({});
    await CollectionRecord.deleteMany({});

    console.log('Cleaned up previous hotels, sensor readings, and collection records.');

    // Seed 10 new Hotels
    for (const hData of djerbaHotelsData) {
      // 1. Create user for hotel
      const user = await User.create({
        name: hData.name,
        email: hData.email,
        password: 'password123',
        role: 'hotel',
      });

      // 2. Create Hotel profile
      const hotel = await Hotel.create({
        user: user._id,
        name: hData.name,
        address: 'Djerba, Tunisia',
        location: {
          lat: hData.lat,
          lng: hData.lng,
        },
        sensors: {
          weight: hData.weight,
          organicMatter: hData.organicMatter,
          status: 'online',
          lastUpdated: new Date(),
        },
      });

      // 3. Seed sensor readings (history) for charts (last 30 days)
      const readings = [];
      const now = new Date();
      for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
        const ts = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
        // Vary weight and quality around target values
        const weight = Math.max(0, Math.floor(hData.weight * (0.8 + Math.random() * 0.4)));
        const organicMatter = Math.min(100, Math.max(80, Math.floor(hData.organicMatter * (0.95 + Math.random() * 0.08))));
        readings.push({
          hotel: hotel._id,
          weight,
          organicMatter,
          timestamp: ts,
        });
      }
      await SensorReading.insertMany(readings);

      console.log(`Seeded hotel and readings for: ${hData.name}`);
    }

    console.log('Successfully seeded 10 Djerba Hotels!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding:', err);
    process.exit(1);
  }
};

seed();
