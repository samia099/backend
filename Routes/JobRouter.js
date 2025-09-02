const express = require("express");
const router = express.Router();
const {
  createJob,
  updateJob,
  deleteJob,
  getJobs,
  getJobById,
} = require("../Controllers/JobController");
const ensureAuthenticated = require("../Middlewares/Auth");
const checkRole = require("../Middlewares/RoleCheck");

router.post("/", ensureAuthenticated, checkRole(["employer"]), createJob);
router.put("/:id", ensureAuthenticated, checkRole(["employer", "admin"]), updateJob);
router.delete("/:id", ensureAuthenticated, checkRole(["employer", "admin"]), deleteJob);
router.get("/", getJobs);
router.get("/:id", getJobById);

module.exports = router;