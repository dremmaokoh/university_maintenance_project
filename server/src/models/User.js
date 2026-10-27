const mongoose = require('mongoose');
const { ROLES, ROLE_VALUES, ACCOUNT_STATUS, ACCOUNT_STATUS_VALUES } = require('../constants');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    organisation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: true
    },
    passwordHash: {
      type: String,
      select: false,
      default: null
    },
    role: {
      type: String,
      enum: ROLE_VALUES,
      required: true
    },
    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUS_VALUES,
      default: ACCOUNT_STATUS.ACTIVE
    },
    inviteTokenHash: {
      type: String,
      select: false,
      default: null
    },
    inviteTokenExpiresAt: {
      type: Date,
      default: null
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
      default: null
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

userSchema.index({ email: 1, organisation: 1 }, { unique: true });
userSchema.index({ organisation: 1, role: 1 });
userSchema.index({ inviteTokenHash: 1 }, { sparse: true });
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });

module.exports = mongoose.model('User', userSchema);
