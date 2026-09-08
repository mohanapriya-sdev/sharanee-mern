const express = require("express");

const router = express.Router();

const {
    createComplaint,
    createGuestComplaint,
    getMyComplaints,
    getGuestComplaints,
    getAllComplaints,
    updateComplaintStatus,
} = require("../controllers/complaintController");


const {
    protect,
    admin,
} = require("../middleware/auth");

// GUEST: Create complaint
router.post("/guest", createGuestComplaint);
router.post("/guest/my", getGuestComplaints);


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