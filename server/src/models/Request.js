const mongoose = require('mongoose');
const { STATUSES, STATUS_VALUES } = require('../constants');

const requestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    location: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      default: STATUSES.PENDING
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { timestamps: true }
);

requestSchema.index({ requester: 1, createdAt: -1 });
requestSchema.index({ assignedOfficer: 1, status: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Request', requestSchema);
