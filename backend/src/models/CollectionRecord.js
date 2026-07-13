const mongoose = require('mongoose');

const CollectionRecordSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    collector: {
      type: String,
      enum: ['pnud', 'municipality'],
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // references User with role 'driver'
    },
    weight: {
      type: Number, // collected weight in kg or tons
      required: true,
    },
    organicMatter: {
      type: Number, // collected organic matter percentage
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'redirected', 'cancelled'],
      default: 'pending',
    },
    redirectionReason: {
      type: String,
      enum: ['low_quality', 'low_quantity', 'truck_capacity', 'none'],
      default: 'none',
    },
    collectedAt: {
      type: Date,
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('CollectionRecord', CollectionRecordSchema);
