const mongoose = require('mongoose');
const { STATUS_VALUES } = require('../constants');

const statusUpdateSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true
    },
    status: {
      type: String,
      enum: STATUS_VALUES,
      required: true
    },
    note: {
      type: String,
      default: '',
      trim: true
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

statusUpdateSchema.index({ request: 1, createdAt: 1 });

module.exports = mongoose.model('StatusUpdate', statusUpdateSchema);
