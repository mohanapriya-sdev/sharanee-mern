const Cart = require("../models/Cart");
const asyncHandler = require("../utils/asyncHandler");
const Product = require("../models/Product");
const Discount = require("../models/Discount");

// @route  POST /api/cart   body: { user, product, quantity }
const addToCart = asyncHandler(async (req, res) => {
  const {
    user,
    product,
    quantity = 1,
    selectedColor = "",
    selectedSize = "",
  } = req.body;

  if (!user || !product) {
    return res
      .status(400)
      .json({
        message: "user and product are required",
      });
  }

  let item = await Cart.findOne({
    user,
    product,
    selectedColor,
    selectedSize,
  });

  if (item) {
    item.quantity += Number(quantity) || 1;
    await item.save();
  } else {

    item = await Cart.create({
      user,
      product,
      quantity,
      selectedColor,
      selectedSize,
    });

  }

  await item.populate("product");

  res.status(201).json({ item });
});

// @route  GET /api/cart/:userId
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.find({
    user: req.params.userId,
  }).populate({
    path: "product",
    populate: {
      path: "category",
      select: "categoryName",
    },
  });

  console.log("CART FROM DB:");
  console.log(
    cart.map((c) => ({
      product: c.product?.productName,
      selectedColor: c.selectedColor,
      selectedSize: c.selectedSize,
    }))
  );

  const today = new Date();

  const discounts = await Discount.find({
    active: true,
    startDate: { $lte: today },
    endDate: { $gte: today },
  });

  const updatedCart = cart.map((item) => {
    const cartItem = item.toObject();
    const product = cartItem.product;

    // If product was deleted, return the cart item safely
    if (!product) {
      return cartItem;
    }

    let finalPrice = product.price;
    let appliedDiscount = null;

    const discount = discounts.find((d) => {
      // Product discount
      if (
        d.applyTo === "Product" &&
        d.product &&
        d.product.toString() === product._id.toString()
      ) {
        return true;
      }

      // Category discount
      if (
        d.applyTo === "Category" &&
        d.category &&
        product.category &&
        d.category.toString() === product.category._id.toString()
      ) {
        return true;
      }

      return false;
    });

    if (discount) {
      if (discount.discountType === "Percentage") {
        finalPrice =
          product.price -
          (product.price * discount.discountValue) / 100;
      } else if (discount.discountType === "Flat") {
        finalPrice =
          product.price - discount.discountValue;
      }

      finalPrice = Math.max(finalPrice, 0);

      appliedDiscount = {
        offerName: discount.offerName,
        discountType: discount.discountType,
        discountValue: discount.discountValue,
      };
    }

    return {
      ...cartItem,
      product: {
        ...product,
        originalPrice: product.price,
        finalPrice: Math.round(finalPrice * 100) / 100,
        discount: appliedDiscount,
      },
    };
  });

  res.json({ cart: updatedCart });
});


// @route  PUT /api/cart/:id   body: { quantity }
const updateQty = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: "quantity must be at least 1" });
  }
  const item = await Cart.findByIdAndUpdate(req.params.id, { quantity }, { new: true }).populate("product");
  if (!item) return res.status(404).json({ message: "Cart item not found" });
  res.json({ item });
});

// @route  DELETE /api/cart/:id
const removeFromCart = asyncHandler(async (req, res) => {
  const item = await Cart.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Cart item not found" });
  res.json({ message: "Removed from cart" });
});

module.exports = { addToCart, getCart, updateQty, removeFromCart };
