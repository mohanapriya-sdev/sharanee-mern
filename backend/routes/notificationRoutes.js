const express = require("express");
const router = express.Router();

const {
  addNotification,
  listNotifications,
  getMyNotifications,
  markRead,
  removeNotification,
} = require("../controllers/notificationController");

const { protect, admin } = require("../middleware/auth");


// CUSTOMER - get own notifications
router.get("/my", protect, getMyNotifications);


// ADMIN notifications
router.post("/", protect, admin, addNotification);

router.get("/", protect, admin, listNotifications);


// Mark notification as read
router.put("/:id/read", protect, markRead);


// Delete notification
router.delete("/:id", protect, removeNotification);


module.exports = router;