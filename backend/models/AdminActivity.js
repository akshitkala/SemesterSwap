const mongoose = require('mongoose');

// V2 spec: actor (nullable ObjectId), actorType (user|system),
// target (ObjectId), targetModel (User|Book), action (uppercase string)
const adminActivitySchema = new mongoose.Schema({
  actor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,  // null when actorType is 'system'
  },
  actorType: {
    type: String,
    enum: ['user', 'system'],
    required: true,
  },
  target: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  targetModel: {
    type: String,
    enum: ['User', 'Book'],
    required: true,
  },
  action: {
    type: String,
    required: true,
    // Uppercase action strings per roadmap spec:
    // USER_PROMOTED, USER_DEMOTED, USER_BANNED, USER_UNBANNED,
    // LISTING_APPROVED, LISTING_REJECTED, LISTING_DELETED,
    // AUTO_APPROVE_LISTING, APPROVAL_MODE_CHANGED
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// Indexes for audit log viewer queries (Phase 5)
adminActivitySchema.index({ actor: 1, timestamp: -1 });
adminActivitySchema.index({ target: 1 });
adminActivitySchema.index({ actorType: 1 });
adminActivitySchema.index({ action: 1 });

module.exports = mongoose.model('AdminActivity', adminActivitySchema);
