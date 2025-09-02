const ApplicationModel = require("../Models/Application");
const JobModel = require("../Models/Job");
const NotificationModel = require("../Models/Notification");
const UserModel = require("../Models/User");

// ApplicationController.js - Update the applyForJob function
const applyForJob = async (req, res) => {
  try {
    const { _id: applicantId } = req.user;
    const { jobId } = req.params;
    const { coverLetter } = req.body;

    // Check if resume file was uploaded
    if (!req.file) {
      return res.status(400).json({
        message: "Resume file is required",
        success: false,
      });
    }

    // Check if job exists and is active
    const job = await JobModel.findById(jobId);
    if (!job || job.status !== "approved") {
      return res.status(400).json({
        message: "Job is not available for application",
        success: false,
      });
    }

    // Check if deadline has passed
    if (new Date(job.deadline) < new Date()) {
      return res.status(400).json({
        message: "Application deadline has passed",
        success: false,
      });
    }

    // Check if already applied
    const existingApplication = await ApplicationModel.findOne({
      job: jobId,
      applicant: applicantId,
    });
    if (existingApplication) {
      return res.status(400).json({
        message: "You have already applied for this job",
        success: false,
      });
    }

    // Store the file data in MongoDB
    const application = new ApplicationModel({
      job: jobId,
      applicant: applicantId,
      coverLetter,
      resume: {
        data: req.file.buffer,        // Binary data from multer
        contentType: req.file.mimetype, // MIME type
        fileName: req.file.originalname // Original file name
      }
    });
    await application.save();

    // Create notification for employer
    const notification = new NotificationModel({
      user: job.employer,
      message: `New application for your job: ${job.title}`,
      type: "application",
      relatedItem: application._id,
    });
    await notification.save();

    res.status(201).json({
      message: "Application submitted successfully",
      success: true,
      application,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { _id: userId, role } = req.user;
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    const application = await ApplicationModel.findById(applicationId).populate(
      "job"
    );
    if (!application) {
      return res.status(404).json({
        message: "Application not found",
        success: false,
      });
    }

    // Only employer who owns the job or admin can update status
    if (application.job.employer.toString() !== userId && role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized to update this application",
        success: false,
      });
    }

    application.status = status;
    if (notes) application.notes = notes;
    application.updatedAt = new Date();
    await application.save();

    // Create notification for applicant
    const notification = new NotificationModel({
      user: application.applicant,
      message: `Your application status has been updated to ${status}`,
      type: "application",
      relatedItem: application._id,
    });
    await notification.save();

    res.status(200).json({
      message: "Application status updated successfully",
      success: true,
      application,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const getApplicationsForJob = async (req, res) => {
  try {
     const { _id: userId, role } = req.user;
    const { jobId } = req.params;
    console.log(userId);
    

    const job = await JobModel.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    // Only employer who owns the job or admin can view applications
    if (job.employer.toString() !== userId && role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized to view these applications",
        success: false,
      });
    }

    const applications = await ApplicationModel.find({ job: jobId }).populate(
      "applicant",
      "name email photo resume skills"
    );

    res.status(200).json({
      message: "Applications retrieved successfully",
      success: true,
      applications,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const getUserApplications = async (req, res) => {
  try {
    const { _id: userId } = req.user;

    const applications = await ApplicationModel.find({ applicant: userId })
      .populate("job", "title employer status")
      .populate("job.employer", "name company.name");

    res.status(200).json({
      message: "Your applications retrieved successfully",
      success: true,
      applications,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const getApplicationsByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(404).json({
        message: "User not found with this email",
        success: false,
      });
    }

    // Get all applications for this user
    const applications = await ApplicationModel.find({ applicant: user._id })
      .populate("job", "title employer status deadline")
      .populate("job.employer", "name company.name")
      .sort({ appliedAt: -1 });

    res.status(200).json({
      message: "Applications retrieved successfully by email",
      success: true,
      applications,
      user: {
        name: user.name,
        email: user.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const getResume = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { _id: userId, role } = req.user;
    
    const application = await ApplicationModel.findById(applicationId);
    if (!application || !application.resume.data) {
      return res.status(404).json({
        message: "Resume not found",
        success: false,
      });
    }

    // Check if user has permission to view this resume
    const job = await JobModel.findById(application.job);
    
    // Allow applicant, employer, or admin to view
    const isApplicant = application.applicant.toString() === userId;
    const isEmployer = job.employer.toString() === userId;
    
    if (!isApplicant && !isEmployer && role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized to view this resume",
        success: false,
      });
    }

    // Set appropriate headers and send the PDF
    res.set("Content-Type", application.resume.contentType);
    res.set("Content-Disposition", `inline; filename="${application.resume.fileName}"`);
    res.send(application.resume.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

module.exports = {
  applyForJob,
  updateApplicationStatus,
  getApplicationsForJob,
  getUserApplications,
  getApplicationsByEmail,
  getResume
};