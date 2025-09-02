const express = require("express");
const router = express.Router();
const {
  createReport,
  getUserReports,
} = require("../Controllers/ReportController");
const ensureAuthenticated = require("../Middlewares/Auth");

router.post("/", ensureAuthenticated, createReport);
router.get("/my-reports", ensureAuthenticated, getUserReports);

module.exports = router;