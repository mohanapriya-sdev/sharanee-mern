const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "Requested",
        "Approved",
        "Rejected",
        "Pickup Scheduled",
        "Picked Up",
        "Received",
        "Refunded",
      ],
      default: "Requested",
    },

    refundStatus: {
      type: String,
      enum: [
        "Not Started",
        "Processing",
        "Refunded",
      ],
      default: "Not Started",
    },
    refundMethod: {
      type: String,
      enum: [
        "Original Payment Method",
        "Bank Transfer",
        "UPI",
        "Not Selected",
      ],
      default: "Not Selected",
    },

    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    adminRemark: {
      type: String,
      trim: true,
      default: "",
    },

    approvedAt: {
      type: Date,
      default: null,
    },

    pickupScheduledAt: {
      type: Date,
      default: null,
    },

    pickedUpAt: {
      type: Date,
      default: null,
    },

    refundedAt: {
      type: Date,
      default: null,
    },

  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Return", returnSchema);