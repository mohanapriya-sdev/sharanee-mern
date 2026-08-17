const express = require("express");
const router = express.Router();

const {
    getSettings,
    updateSettings,
} = require("../controllers/settingController");

const { protect, admin } = require("../middleware/auth");

// Customer can read settings
router.get("/", getSettings);

// Only admin can update settings
router.put("/", protect, admin, updateSettings);

module.exports = router;