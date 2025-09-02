// NotificationRouter.js (updated)
const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  getUnreadCount,
} = require("../Controllers/NotificationController");
const ensureAuthenticated = require("../Middlewares/Auth");

router.get("/", ensureAuthenticated, getNotifications);
router.get("/unread-count", ensureAuthenticated, getUnreadCount);
router.put("/:notificationId/read", ensureAuthenticated, markAsRead);

module.exports = router;