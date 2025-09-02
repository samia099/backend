const ReportModel = require("../Models/Report");

const createReport = async (req, res) => {
  try {
    const { id: reporterId } = req.user;
    const { reportedItemType, reportedItem, reason } = req.body;

    const report = new ReportModel({
      reporter: reporterId,
      reportedItemType,
      reportedItem,
      reason,
    });
    await report.save();

    res.status(201).json({
      message: "Report submitted successfully",
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

const getUserReports = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const reports = await ReportModel.find({ reporter: userId })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      message: "Your reports retrieved successfully",
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

module.exports = {
  createReport,
  getUserReports,
};