const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const UserModel = require("../Models/User");

const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role
    const validRoles = ["admin", "employer", "jobseeker"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role specified",
        success: false,
      });
    }

    const user = await UserModel.findOne({ email });
    if (user) {
      return res.status(409).json({
        message: "User already exists, please login",
        success: false,
      });
    }

    const userData = {
      name,
      email,
      password: await bcrypt.hash(password, 10),
      role: role || "jobseeker",
    };

    // Initialize profile based on role
    if (role === "jobseeker") {
      userData.jobSeekerProfile = {
        bio: "",
        skills: [],
        experience: [],
        education: [],
      };
    } else if (role === "employer") {
      userData.employerProfile = {
        company: {
          name: "",
          website: "",
        },
        contactInfo: {},
      };
    }

    const newUser = await UserModel.create(userData);

    res.status(201).json({
      message: "Signup successful",
      success: true,
      userId: newUser._id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
const signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });
    const errorMsg = "Authentication failed: email or password is incorrect";

    if (!user) {
      return res.status(403).json({ message: errorMsg, success: false });
    }

    const isPassEqual = await bcrypt.compare(password, user.password);
    if (!isPassEqual) {
      return res.status(403).json({ message: errorMsg, success: false });
    }

    const jwtToken = jwt.sign(
      { email: user.email, _id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      message: "Login successful",
      success: true,
      jwtToken,
      email: user.email,
      name: user.name,
      _id: user._id,
      role: user.role,
      photo: user.photo,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "User data retrieved successfully",
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
const getCurrentUser = async (req, res) => {
  try {
    // req.user is set by the ensureAuthenticated middleware
    const user = await UserModel.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Current user retrieved successfully",
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
  signup,
  signin,
  getUserById,
  getCurrentUser,
  addSavedJob,
  removeSavedJob,
  getSavedJobs,
};
