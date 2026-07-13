const mongoose = require('mongoose');

const SensorReadingSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    organicMatter: {
      type: Number,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SensorReading', SensorReadingSchema);
