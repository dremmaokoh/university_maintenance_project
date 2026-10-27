const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: true
    },
    officer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

assignmentSchema.index({ request: 1, createdAt: -1 });
assignmentSchema.index({ officer: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
