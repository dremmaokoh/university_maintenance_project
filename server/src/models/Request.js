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
    organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true
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
    },
    completedAt: {
      type: Date,
      default: null
    },
    officerRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null
    },
    ratedAt: {
      type: Date,
      default: null
    },
    evidence: {
      originalName: { type: String, default: null },
      storageKey: { type: String, default: null },
      mimeType: { type: String, default: null },
      size: { type: Number, default: null },
      uploadedAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

requestSchema.index({ organisation: 1, createdAt: -1 });
requestSchema.index({ organisation: 1, status: 1 });
requestSchema.index({ requester: 1, createdAt: -1 });
requestSchema.index({ assignedOfficer: 1, status: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ title: 'text', description: 'text', location: 'text' });

module.exports = mongoose.model('Request', requestSchema);
