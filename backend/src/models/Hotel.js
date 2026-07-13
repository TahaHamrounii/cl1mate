const mongoose = require('mongoose');

const HotelSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add the hotel name'],
      trim: true,
    },
    address: {
      type: String,
    },
    location: {
      lat: {
        type: Number,
        required: true,
      },
      lng: {
        type: Number,
        required: true,
      },
    },
    sensors: {
      weight: {
        type: Number, // current weight in kg
        default: 0,
      },
      organicMatter: {
        type: Number, // percentage between 0 and 100
        default: 0,
      },
      status: {
        type: String,
        enum: ['online', 'offline', 'error'],
        default: 'online',
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
    },
    config: {
      minWeightThreshold: {
        type: Number, // quantity threshold below which PNUD redirects to municipality
        default: 100, // e.g. 100 kg
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Hotel', HotelSchema);
