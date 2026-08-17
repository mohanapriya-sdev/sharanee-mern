const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },


    discountType: {
      type: String,
      enum: ["Percentage", "Flat", "Free Shipping"],
      default: "Percentage",
    },

    discountValue: {
      type: Number,
      default: 0,
    },

    // For example: 20% OFF up to ₹200
    maximumDiscount: {
      type: Number,
      default: 0,
    },

    // Where this coupon can be used
    applicableTo: {
      type: String,
      enum: ["All Products", "Inskirts", "Saree Pins"],
      default: "All Products",
    },

    minimumOrderAmount: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
      required: true,
    },

    expiryDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["Scheduled", "Active", "Expired"],
      default: "Scheduled",
    },

    maxUses: {
      type: Number,
      default: 100,
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    remainingCount: {
      type: Number,
      default: 100,
    },

    // Customer can use only on their first order
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },

    active: {
      type: Boolean,
      default: true,
    },


  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Coupon", couponSchema);
