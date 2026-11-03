const mongoose = require('mongoose');
const { ROLE_VALUES, MEMBER_TYPE_VALUES } = require('../constants');

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
    authorSnapshot: {
      fullName: { type: String, trim: true },
      role: { type: String, enum: ROLE_VALUES },
      memberType: { type: String, enum: MEMBER_TYPE_VALUES }
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
