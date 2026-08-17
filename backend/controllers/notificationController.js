const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

// ADMIN: Create notification
// @route POST /api/notifications
const addNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.create({
    ...req.body,
    user: null,
  });

  res.status(201).json({ notification });
});


// ADMIN: Get only admin/general notifications
// @route GET /api/notifications
const listNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    user: null,
  }).sort({ createdAt: -1 });

  res.json({ notifications });
});


// CUSTOMER: Get only their notifications
// @route GET /api/notifications/my
const getMyNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    user: req.user._id,
  }).sort({ createdAt: -1 });

  res.json({ notifications });
});


// MARK AS READ
// @route PUT /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { read: true }, // IMPORTANT: your schema uses "read"
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      message: "Notification not found",
    });
  }

  res.json({ notification });
});


// DELETE NOTIFICATION
// @route DELETE /api/notifications/:id
const removeNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndDelete(
    req.params.id
  );

  if (!notification) {
    return res.status(404).json({
      message: "Notification not found",
    });
  }

  res.json({
    message: "Notification removed",
  });
});


module.exports = {
  addNotification,
  listNotifications,
  getMyNotifications,
  markRead,
  removeNotification,
};