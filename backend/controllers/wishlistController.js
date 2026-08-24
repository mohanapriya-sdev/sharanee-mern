const Wishlist = require("../models/Wishlist");
const asyncHandler = require("../utils/asyncHandler");

// @route  POST /api/wishlist   body: { user, product }
const addToWishlist = asyncHandler(async (req, res) => {
  const {
    user,
    product,
    selectedColor,
    selectedCategory,
    selectedSize,
  } = req.body;
  if (!user || !product) {
    return res.status(400).json({ message: "user and product are required" });
  }

  const exists = await Wishlist.findOne({
    user,
    product,
    selectedColor,
    selectedCategory,
    selectedSize,
  });
  if (exists) {
    return res.status(400).json({ message: "Already in wishlist" });
  }

  const item = await Wishlist.create({
    user,
    product,
    selectedColor,
    selectedCategory,
    selectedSize,
  });
  await item.populate("product");
  res.status(201).json({ item });
});

// @route  GET /api/wishlist/:userId
const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.find({
    user: req.params.userId,
  }).populate("product");

  console.log("===== WISHLIST DATA =====");

  wishlist.forEach((item) => {
    console.log("Selected Color:", item.selectedColor);

    console.log(
      "Product Variants:",
      item.product?.colorVariants?.map((v) => ({
        family: v.colorFamily,
        name: v.colorName,
      }))
    );
  });

  res.json({ wishlist });
});

// @route  DELETE /api/wishlist/:id
const removeFromWishlist = asyncHandler(async (req, res) => {
  const item = await Wishlist.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Wishlist item not found" });
  res.json({ message: "Removed from wishlist" });
});

module.exports = { addToWishlist, getWishlist, removeFromWishlist };
