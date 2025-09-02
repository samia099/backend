const express = require("express");
const router = express.Router();
const { updateProfile, getDashboardData } = require("../Controllers/UserController");
const ensureAuthenticated = require("../Middlewares/Auth");

router.get("/dashboard", ensureAuthenticated, getDashboardData);
router.put("/profile", ensureAuthenticated, updateProfile);




module.exports = router;