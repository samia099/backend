const express = require("express");
const router = express.Router();
const {
  applyForJob,
  updateApplicationStatus,
  getApplicationsForJob,
  getUserApplications,
  getApplicationsByEmail,
  getResume
} = require("../Controllers/ApplicationController");
const ensureAuthenticated = require("../Middlewares/Auth");
const upload = require("../Middlewares/Upload");

router.post(
  "/:jobId",
  ensureAuthenticated,
  upload.single("resume"),
  applyForJob
);
router.put(
  "/status/:applicationId",
  ensureAuthenticated,
  updateApplicationStatus
);
router.get("/job/:jobId", ensureAuthenticated, getApplicationsForJob);
router.get("/my-applications", ensureAuthenticated, getUserApplications);
router.get("/by-email/:email", ensureAuthenticated, getApplicationsByEmail);
router.get("/resume/:applicationId", ensureAuthenticated, getResume);

module.exports = router;