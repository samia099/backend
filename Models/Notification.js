const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "bdJobBoxUsers",
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["application", "job", "system", "report", "job_approved", "job_rejected"],
    required: true,
  },
  relatedItem: {
    type: Schema.Types.ObjectId,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const NotificationModel = mongoose.model("BDJobBoxNotification", NotificationSchema);
module.exports = NotificationModel;