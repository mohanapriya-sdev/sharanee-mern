const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    // Logged-in customer who sent this message
    // Guest messages can still have user = null
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
    },

    comment: {
      type: String,
      required: [true, "Comment is required"],
      trim: true,
    },

    status: {
      type: String,
      enum: ["New", "Read", "Replied"],
      default: "New",
    },

    adminReply: {
      type: String,
      trim: true,
      default: "",
    },

    repliedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Contact", contactSchema);