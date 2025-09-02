const JobModel = require("../Models/Job");
const ApplicationModel = require("../Models/Application");

const createJob = async (req, res) => {
  try {
    const { _id, role, email } = req.user; // Get email from user

    if (role !== "employer") {
      return res.status(403).json({
        message: "Only employers can create jobs",
        success: false,
      });
    }

    const jobData = {
      ...req.body,
      employer: _id,
      employerEmail: email, // Add employer email
      status: "pending",
    };

    // Rest of the function remains the same
    const job = new JobModel(jobData);
    await job.save();

    res.status(201).json({
      message: "Job created successfully and pending admin approval",
      success: true,
      job,
    });
  } catch (err) {
    // Error handling remains the same
  }
};

const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const job = await JobModel.findById(id);
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    // Only employer who created the job or admin can update it
    if (job.employer.toString() !== userId && role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized to update this job",
        success: false,
      });
    }

    const updatedJob = await JobModel.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Job updated successfully",
      success: true,
      job: updatedJob,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    const job = await JobModel.findById(id);
    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    // Only employer who created the job or admin can delete it
    if (job.employer.toString() !== userId && role !== "admin") {
      return res.status(403).json({
        message: "Unauthorized to delete this job",
        success: false,
      });
    }

    await JobModel.findByIdAndDelete(id);
    // Also delete related applications
    await ApplicationModel.deleteMany({ job: id });

    res.status(200).json({
      message: "Job deleted successfully",
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

const getJobs = async (req, res) => {
  try {
    const { search, location, type, minSalary, skills, employerEmail } =
      req.query;
    const filter = {};
    // console.log(employerEmail);
    

    if (employerEmail) {
      // Filter by employer email regardless of status
      filter.employerEmail = employerEmail;
    } else if (req.user) {
      // Existing role-based filtering for other cases
      if (req.user.role === "admin") {
        // Admins can see all jobs
      } else if (req.user.role === "employer") {
        // Employers see their own jobs regardless of status
        filter.employer = req.user._id;
      } else {
        // Job seekers only see approved jobs
        filter.status = "approved";
      }
    } else {
      // Public/unauthenticated users only see approved jobs
      filter.status = "approved";
    }

    // Rest of the filtering logic remains the same
    if (search) filter.title = { $regex: search, $options: "i" };
    if (location) filter.location = { $regex: location, $options: "i" };
    if (type) filter.type = type;
    if (minSalary) filter["salary.min"] = { $gte: parseInt(minSalary) };
    if (skills) filter.skills = { $in: skills.split(",") };

    const jobs = await JobModel.find(filter)
      .populate("employer", "name company.name photo")
      .sort({ createdAt: -1 });
    // console.log(jobs);
    

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
const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    const job = await JobModel.findById(id).populate(
      "employer",
      "name company.name photo"
    );

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Job retrieved successfully",
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


module.exports = {
  createJob,
  updateJob,
  deleteJob,
  getJobs,
  getJobById,
};
