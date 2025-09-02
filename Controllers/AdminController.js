const UserModel = require("../Models/User");
const JobModel = require("../Models/Job");
const ReportModel = require("../Models/Report");
const ApplicationModel = require("../Models/Application");
const NotificationModel = require("../Models/Notification");

const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find().select("-password");
    res.status(200).json({
      message: "Users retrieved successfully",
      success: true,
      users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "User status updated successfully",
      success: true,
      user,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const jobs = await JobModel.find()
      .populate("employer", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Jobs retrieved successfully",
      success: true,
      jobs,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const getPendingReports = async (req, res) => {
  try {
    const reports = await ReportModel.find({ status: "pending" })
      .populate("reporter", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Pending reports retrieved successfully",
      success: true,
      reports,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, resolutionNotes } = req.body;

    const report = await ReportModel.findById(reportId);
    if (!report) {
      return res.status(404).json({
        message: "Report not found",
        success: false,
      });
    }

    report.status = "resolved";
    report.resolutionNotes = resolutionNotes;
    report.resolvedBy = req.user.id;
    report.resolvedAt = new Date();
    await report.save();

    // Take action based on resolution
    if (action === "disableUser") {
      await UserModel.findByIdAndUpdate(report.reportedItem, {
        isActive: false,
      });
    } else if (action === "removeContent") {
      // Logic to remove reported content based on type
      if (report.reportedItemType === "job") {
        await JobModel.findByIdAndDelete(report.reportedItem);
      }
    }

    res.status(200).json({
      message: "Report resolved successfully",
      success: true,
      report,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const approveJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { action } = req.body; // "approve" or "reject"

    const job = await JobModel.findById(jobId);
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    if (action === "approve") {
      job.status = "approved";
    } else if (action === "reject") {
      job.status = "rejected";
    } else {
      return res.status(400).json({
        message: "Invalid action",
        success: false,
      });
    }

    await job.save();

    // Create notification for employer
    const notification = new NotificationModel({
      user: job.employer,
      message: `Your job "${job.title}" has been ${
        action === "approve" ? "approved" : "rejected"
      }`,
      type: action === "approve" ? "job_approved" : "job_rejected",
      relatedItem: job._id,
    });
    await notification.save();

    res.status(200).json({
      message: `Job ${action}d successfully`,
      success: true,
      job,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res.status(400).json({
        message: "You cannot delete your own account",
        success: false,
      });
    }

    // Delete user and all their related data
    await UserModel.findByIdAndDelete(userId);

    // Delete user's jobs if they're an employer
    if (user.role === "employer") {
      await JobModel.deleteMany({ employer: userId });
    }

    // Delete user's applications if they're a job seeker
    if (user.role === "jobseeker") {
      await ApplicationModel.deleteMany({ applicant: userId });
    }

    res.status(200).json({
      message: "User deleted successfully",
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
module.exports = {
  getAllUsers,
  updateUserStatus,
  getAllJobs,
  getPendingReports,
  resolveReport,
  approveJob,
  deleteUser,
};
