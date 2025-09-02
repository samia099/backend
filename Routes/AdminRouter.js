const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUserStatus,
  getAllJobs,
  getPendingReports,
  resolveReport,
  approveJob,
  deleteUser
} = require("../Controllers/AdminController");
const ensureAuthenticated = require("../Middlewares/Auth");
const checkRole = require("../Middlewares/RoleCheck");

router.get("/users", ensureAuthenticated, checkRole(["admin"]), getAllUsers);
router.put("/users/:userId", ensureAuthenticated, checkRole(["admin"]), updateUserStatus);
router.get("/jobs", ensureAuthenticated, checkRole(["admin"]), getAllJobs);
router.get("/reports/pending", ensureAuthenticated, checkRole(["admin"]), getPendingReports);
router.put("/jobs/:jobId", ensureAuthenticated, checkRole(["admin"]), approveJob);
router.put("/reports/resolve/:reportId", ensureAuthenticated, checkRole(["admin"]), resolveReport);
router.delete("/users/:userId", ensureAuthenticated, checkRole(["admin"]), deleteUser);
// router.get('/admin/jobs', ensureAuthenticated, checkRole(['admin']), getAllJobs);
// router.put('/admin/jobs/:jobId', ensureAuthenticated, checkRole(['admin']), adminController.approveJob);
// router.post('/applications/:jobId', ensureAuthenticated, checkRole(['jobseeker']), applicationController.applyForJob);

module.exports = router;