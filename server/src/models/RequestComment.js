const mongoose = require('mongoose');

const requestCommentSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    body: {
      type: String,
      required: true,
      trim: true
    },
    visibleToRequester: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

requestCommentSchema.index({ request: 1, createdAt: 1 });

module.exports = mongoose.model('RequestComment', requestCommentSchema);
