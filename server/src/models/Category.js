const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true
    }
  },
  { timestamps: true }
);

categorySchema.index({ organisation: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
