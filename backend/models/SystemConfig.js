const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  approvalMode: {
    type: String,
    enum: ['manual', 'automatic'],
    default: 'manual',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
