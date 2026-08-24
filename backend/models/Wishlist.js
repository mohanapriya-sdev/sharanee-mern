const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    selectedColor: {
      type: String,
      default: "",
    },

    selectedCategory: {
      type: String,
      default: "",
    },

    selectedSize: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Allow same product with different colors/sizes
wishlistSchema.index(
  {
    user: 1,
    product: 1,
    selectedColor: 1,
    selectedCategory: 1,
    selectedSize: 1,
  },
  { unique: true }
);

module.exports = mongoose.model("Wishlist", wishlistSchema);