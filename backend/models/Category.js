const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    categoryName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    categoryGroup: {
      type: String,
      required: true,
      enum: ["Inskirts", "Pins"],
      default: "Inskirts",
    },

    categoryImages: {
      type: [String],
      default: [],
    },

    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);