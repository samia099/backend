const UserModel = require("../Models/User");
const bcrypt = require("bcrypt");

const updateProfile = async (req, res) => {
  try {
    // Fix: Use _id instead of id (JWT payload uses _id)
    const { _id } = req.user;
    const updates = req.body;
    const user = await UserModel.findById(_id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Prevent role change unless by admin
    if (updates.role && req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admins can change user roles",
        success: false,
      });
    }

    // Handle password update
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    // Handle profile updates based on role
    if (user.role === "jobseeker" && updates.jobSeekerProfile) {
      // Deep merge for jobSeeker profile
      const existingProfile = user.jobSeekerProfile || {};
      updates.jobSeekerProfile = {
        bio: updates.jobSeekerProfile.bio !== undefined ? updates.jobSeekerProfile.bio : existingProfile.bio,
        skills: updates.jobSeekerProfile.skills !== undefined ? updates.jobSeekerProfile.skills : existingProfile.skills,
        experience: updates.jobSeekerProfile.experience !== undefined ? updates.jobSeekerProfile.experience : existingProfile.experience,
        education: updates.jobSeekerProfile.education !== undefined ? updates.jobSeekerProfile.education : existingProfile.education,
        contactInfo: {
          ...(existingProfile.contactInfo || {}),
          ...(updates.jobSeekerProfile.contactInfo || {})
        }
      };
    } else if (user.role === "employer" && updates.employerProfile) {
      // Deep merge for employer profile with better handling
      const existingProfile = user.employerProfile || {};
      const existingCompany = existingProfile.company || {};
      const existingContactInfo = existingProfile.contactInfo || {};
      
      // Merge company data
      const updatedCompany = {
        name: updates.employerProfile.company?.name !== undefined 
          ? updates.employerProfile.company.name 
          : existingCompany.name || "",
        website: updates.employerProfile.company?.website !== undefined 
          ? updates.employerProfile.company.website 
          : existingCompany.website || "",
        description: updates.employerProfile.company?.description !== undefined 
          ? updates.employerProfile.company.description 
          : existingCompany.description || "",
        logo: updates.employerProfile.company?.logo !== undefined 
          ? updates.employerProfile.company.logo 
          : existingCompany.logo || "",
        facebook: updates.employerProfile.company?.facebook !== undefined 
          ? updates.employerProfile.company.facebook 
          : existingCompany.facebook || "",
        linkedin: updates.employerProfile.company?.linkedin !== undefined 
          ? updates.employerProfile.company.linkedin 
          : existingCompany.linkedin || "",
        contactEmail: updates.employerProfile.company?.contactEmail !== undefined 
          ? updates.employerProfile.company.contactEmail 
          : existingCompany.contactEmail || "",
        contactPhone: updates.employerProfile.company?.contactPhone !== undefined 
          ? updates.employerProfile.company.contactPhone 
          : existingCompany.contactPhone || ""
      };

      // Merge contact info
      const updatedContactInfo = {
        phone: updates.employerProfile.contactInfo?.phone !== undefined 
          ? updates.employerProfile.contactInfo.phone 
          : existingContactInfo.phone || "",
        address: updates.employerProfile.contactInfo?.address !== undefined 
          ? updates.employerProfile.contactInfo.address 
          : existingContactInfo.address || "",
        city: updates.employerProfile.contactInfo?.city !== undefined 
          ? updates.employerProfile.contactInfo.city 
          : existingContactInfo.city || "",
        country: updates.employerProfile.contactInfo?.country !== undefined 
          ? updates.employerProfile.contactInfo.country 
          : existingContactInfo.country || ""
      };

      // Set the complete employer profile
      updates.employerProfile = {
        company: updatedCompany,
        contactInfo: updatedContactInfo
      };

      console.log("Updated employer profile:", JSON.stringify(updates.employerProfile, null, 2));
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      _id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    console.log("Final updated user:", JSON.stringify(updatedUser, null, 2));

    res.status(200).json({
      message: "Profile updated successfully",
      success: true,
      user: updatedUser,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
      error: err.message
    });
  }
};

const getDashboardData = async (req, res) => {
  try {
    const { _id, role } = req.user;
    let dashboardData = {};

    if (role === "employer") {
      const user = await UserModel.findById(_id)
        .select("employerProfile")
        .populate({
          path: "jobs",
          select: "title status applications",
          populate: {
            path: "applications",
            select: "status applicant createdAt"
          }
        });

      const jobs = user.jobs || [];
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter(job => job.status === "active").length;
      const totalApplications = jobs.reduce(
        (sum, job) => sum + (job.applications ? job.applications.length : 0), 0
      );

      dashboardData = {
        profile: user.employerProfile,
        stats: {
          totalJobs,
          activeJobs,
          totalApplications
        },
        recentJobs: jobs.slice(0, 5),
        recentApplications: jobs.flatMap(job => 
          job.applications ? job.applications.slice(0, 3) : []
        ).slice(0, 5)
      };
    } else if (role === "jobseeker") {
      const user = await UserModel.findById(_id)
        .select("jobSeekerProfile")
        .populate({
          path: "applications",
          select: "status job appliedAt",
          populate: {
            path: "job",
            select: "title company"
          }
        })
        .populate({
          path: "savedJobs",
          select: "job savedAt",
          populate: {
            path: "job",
            select: "title company"
          }
        });

      const applications = user.applications || [];
      const savedJobs = user.savedJobs || [];
      
      const totalApplications = applications.length;
      const shortlisted = applications.filter(
        app => app.status === "shortlisted"
      ).length;

      dashboardData = {
        profile: user.jobSeekerProfile,
        stats: {
          totalApplications,
          shortlisted,
          savedJobs: savedJobs.length
        },
        recentApplications: applications.slice(0, 5),
        savedJobs: savedJobs.slice(0, 5)
      };
    } else if (role === "admin") {
      const totalUsers = await UserModel.countDocuments();
      
      dashboardData = {
        stats: {
          totalUsers,
          totalJobs: 0, 
          totalApplications: 0, 
          pendingReports: 0, 
        }
      };
    }

    res.status(200).json({
      message: "Dashboard data retrieved successfully",
      success: true,
      data: dashboardData,
    });
  } catch (err) {
    console.error("Dashboard data error:", err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const addSavedJob = async (req, res) => {
  try {
    const { _id } = req.user;
    const { jobId } = req.params;

    const user = await UserModel.findById(_id);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Check if job is already saved
    const alreadySaved = user.savedJobs.some(savedJob => 
      savedJob.job.toString() === jobId
    );

    if (alreadySaved) {
      return res.status(400).json({
        message: "Job already bookmarked",
        success: false,
      });
    }

    // Add to saved jobs
    user.savedJobs.push({ job: jobId });
    await user.save();

    res.status(200).json({
      message: "Job bookmarked successfully",
      success: true,
    });
  } catch (err) {
    console.error("Bookmark error:", err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const removeSavedJob = async (req, res) => {
  try {
    const { _id } = req.user;
    const { jobId } = req.params;

    const user = await UserModel.findByIdAndUpdate(
      _id,
      { $pull: { savedJobs: { job: jobId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Bookmark removed successfully",
      success: true,
    });
  } catch (err) {
    console.error("Remove bookmark error:", err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const getSavedJobs = async (req, res) => {
  try {
    const { _id } = req.user;
    
    const user = await UserModel.findById(_id)
      .populate({
        path: "savedJobs.job",
        select: "title employer description location type salary deadline",
        populate: {
          path: "employer",
          select: "name company.name"
        }
      });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Saved jobs retrieved successfully",
      success: true,
      savedJobs: user.savedJobs,
    });
  } catch (err) {
    console.error("Get saved jobs error:", err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

module.exports = {
  updateProfile,
  getDashboardData,
  addSavedJob,
  removeSavedJob,
  getSavedJobs
};