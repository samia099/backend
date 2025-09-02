const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReportSchema = new Schema({
  reporter: {
    type: Schema.Types.ObjectId,
    ref: "bdJobBoxUsers",
    required: true,
  },
  reportedItemType: {
    type: String,
    enum: ["job", "user", "application"],
    required: true,
  },
  reportedItem: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "resolved", "dismissed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: "bdJobBoxUsers",
  },
});

const ReportModel = mongoose.model("BDJobBoxReport", ReportSchema);
module.exports = ReportModel;