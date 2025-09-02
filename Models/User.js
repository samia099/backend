const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const experienceSchema = new Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  current: { type: Boolean, default: false },
  description: { type: String },
});

const educationSchema = new Schema({
  degree: { type: String, required: true },
  institution: { type: String, required: true },
  fieldOfStudy: { type: String },
  startYear: { type: Number, required: true },
  endYear: { type: Number },
  current: { type: Boolean, default: false },
});

const contactInfoSchema = new Schema({
  phone: { type: String },
  address: { type: String },
  city: { type: String },
  country: { type: String },
});

const companySchema = new Schema({
  // name: { type: String, required: true },
  website: { type: String },
  description: { type: String },
  // logo: { type: String },
  facebook: { type: String },
  linkedin: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
});

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["admin", "employer", "jobseeker"],
    default: "jobseeker",
    required: true,
  },
  photo: {
    type: String, // Will store ImageBB URL
    default: null,
  },
  // Job Seeker Specific Fields
  jobSeekerProfile: {
    bio: { type: String, default: "" },
    skills: { type: [String], default: [] },
    resume: { type: String, default: null }, // Will store file URL
    experience: [experienceSchema],
    education: [educationSchema],
    contactInfo: contactInfoSchema,
  },
  // Employer Specific Fields
  employerProfile: {
    company: companySchema,
    contactInfo: contactInfoSchema,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  savedJobs: [
    {
      job: {
        type: Schema.Types.ObjectId,
        ref: "BDJobBoxJobs",
      },
      savedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

UserSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const UserModel = mongoose.model("bdJobBoxUsers", UserSchema);
module.exports = UserModel;
