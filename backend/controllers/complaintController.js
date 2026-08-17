const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");

// CUSTOMER: Create complaint
exports.createComplaint = async (req, res) => {
    try {
        const { complaint, order } = req.body;

        if (!complaint || !complaint.trim()) {
            return res.status(400).json({
                success: false,
                message: "Complaint is required",
            });
        }

        const newComplaint = await Complaint.create({
            customer: req.user._id,
            order: order || null,
            complaint: complaint.trim(),
        });

        res.status(201).json({
            success: true,
            message: "Complaint submitted successfully",
            complaint: newComplaint,
        });
    } catch (error) {
        console.error("Create complaint error:", error);

        res.status(500).json({
            success: false,
            message: "Could not submit complaint",
        });
    }
};

// CUSTOMER: Get my complaints
exports.getMyComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({
            customer: req.user._id,
        })
            .populate("order")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            complaints,
        });
    } catch (error) {
        console.error("Get complaints error:", error);

        res.status(500).json({
            success: false,
            message: "Could not load complaints",
        });
    }
};

// ADMIN: Get all complaints
exports.getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find()
            .populate("customer", "fullName email phone")
            .populate("order")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            complaints,
        });
    } catch (error) {
        console.error("Get all complaints error:", error);

        res.status(500).json({
            success: false,
            message: "Could not load complaints",
        });
    }
};

// ADMIN: Update complaint status
exports.updateComplaintStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "Pending",
            "In Progress",
            "Resolved",
            "Rejected",
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid complaint status",
            });
        }

        const complaint = await Complaint.findById(req.params.id);

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found",
            });
        }

        // Update status
        complaint.status = status;
        await complaint.save();

        // Create notification for customer
        await Notification.create({
            user: complaint.customer,
            title: "Complaint Status Updated",
            message: `Your complaint status has been updated to ${status}.`,
            type: "complaint",
        });

        res.json({
            success: true,
            message: "Complaint status updated",
            complaint,
        });
    } catch (error) {
        console.error("Update complaint error:", error);

        res.status(500).json({
            success: false,
            message: "Could not update complaint",
        });
    }
};