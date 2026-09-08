const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
    {
        // Logged in customer
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // Guest customer
        guestMobile: {
            type: String,
            default: "",
        },

        guestName: {
            type: String,
            default: "",
        },

        guestEmail: {
            type: String,
            default: "",
        },

        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            default: null,
        },

        complaint: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: ["Pending", "In Progress", "Resolved", "Rejected"],
            default: "Pending",
        },
    },
    {
        timestamps: true,
    });

module.exports = mongoose.model("Complaint", complaintSchema);