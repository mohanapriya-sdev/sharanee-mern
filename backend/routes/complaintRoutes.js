const express = require("express");

const router = express.Router();

const {
    createComplaint,
    getMyComplaints,
    getAllComplaints,
    updateComplaintStatus,
} = require("../controllers/complaintController");

const {
    protect,
    admin,
} = require("../middleware/auth");

// CUSTOMER: Create complaint
router.post("/", protect, createComplaint);

// CUSTOMER: Get my complaints
router.get("/my", protect, getMyComplaints);

// ADMIN: Get all complaints
router.get("/", protect, admin, getAllComplaints);

// ADMIN: Update complaint status
router.put(
    "/:id/status",
    protect,
    admin,
    updateComplaintStatus
);

module.exports = router;