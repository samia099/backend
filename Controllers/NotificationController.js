// NotificationController.js (updated)
const NotificationModel = require("../Models/Notification");

const getNotifications = async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const notifications = await NotificationModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.status(200).json({
      message: "Notifications retrieved successfully",
      success: true,
      notifications,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { _id: userId } = req.user;
    const { notificationId } = req.params;

    const notification = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Notification marked as read",
      success: true,
      notification,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const count = await NotificationModel.countDocuments({ 
      user: userId, 
      isRead: false 
    });
    
    res.status(200).json({
      message: "Unread count retrieved successfully",
      success: true,
      count,
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
  getNotifications,
  markAsRead,
  getUnreadCount,
};