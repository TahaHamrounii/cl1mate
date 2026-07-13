const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema(
  {
    minOrganicPercentage: {
      type: Number,
      default: 95, // 95%
      min: 0,
      max: 100,
    },
    minWeightThreshold: {
      type: Number,
      default: 100, // in kg
    },
    truckCapacityTons: {
      type: Number,
      default: 16.7, // 16.7 tons
    },
    activeDriver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);
