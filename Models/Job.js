const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const JobSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: {
    type: [String],
    required: true,
  },
  skills: {
    type: [String],
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["full-time", "part-time", "contract", "freelance", "internship"],
    required: true,
  },
  salary: {
    min: Number,
    max: Number,
    currency: String,
  },
  employer: {
    type: Schema.Types.ObjectId,
    ref: "bdJobBoxUsers",
    required: true,
  },
  // Add to JobSchema
  employerEmail: {
    type: String,
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected", "active", "expired", "filled"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const JobModel = mongoose.model("BDJobBoxJobs", JobSchema);
module.exports = JobModel;
