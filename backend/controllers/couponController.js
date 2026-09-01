const Coupon = require("../models/Coupon");
const asyncHandler = require("../utils/asyncHandler");

// Helper: calculate current coupon status
const getCouponStatus = (coupon) => {
  const today = new Date();

  if (today < new Date(coupon.startDate)) {
    return "Scheduled";
  }

  if (today > new Date(coupon.expiryDate)) {
    return "Expired";
  }

  return "Active";
};

// @route POST /api/coupons (admin)
const createCoupon = asyncHandler(async (req, res) => {
  const couponData = {
    ...req.body,


    // New fields — old coupons/default requests remain safe
    maximumDiscount: Number(req.body.maximumDiscount) || 0,
    applicableTo: req.body.applicableTo || "All Products",
    firstOrderOnly: req.body.firstOrderOnly || false,

    remainingCount: Number(req.body.maxUses) || 100,


  };

  const status = getCouponStatus(couponData);

  const coupon = await Coupon.create({
    ...couponData,
    status,
  });

  res.status(201).json({ coupon });
});

// @route GET /api/coupons (admin)
// @route GET /api/coupons (admin)
const listCoupons = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const totalCoupons = await Coupon.countDocuments();

  const coupons = await Coupon.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  for (const coupon of coupons) {
    const status = getCouponStatus(coupon);

    const remainingCount = Math.max(
      (coupon.maxUses || 0) - (coupon.usedCount || 0),
      0
    );

    if (
      coupon.status !== status ||
      coupon.remainingCount !== remainingCount
    ) {
      coupon.status = status;
      coupon.remainingCount = remainingCount;
      await coupon.save();
    }
  }

  res.json({
    coupons,
    currentPage: page,
    totalPages: Math.ceil(totalCoupons / limit),
    totalCoupons,
    limit,
  });
});





const getActiveCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({
    active: true,
  }).sort({ createdAt: -1 });

  const activeCoupons = [];

  for (const coupon of coupons) {
    const status = getCouponStatus(coupon);

    const remainingCount = Math.max(
      Number(coupon.maxUses || 0) - Number(coupon.usedCount || 0),
      0
    );

    // Update current status and remaining count
    if (
      coupon.status !== status ||
      coupon.remainingCount !== remainingCount
    ) {
      coupon.status = status;
      coupon.remainingCount = remainingCount;
      await coupon.save();
    }

    // Only send coupons that can currently be used
    if (
      status === "Active" &&
      remainingCount > 0
    ) {
      activeCoupons.push(coupon);
    }
  }

  res.json({
    coupons: activeCoupons,
  });
});
// @route POST /api/coupons/apply
// body: { code, totalAmount, items }
const applyCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    totalAmount,
    items = [],
  } = req.body;

  if (!code) {
    return res.status(400).json({
      message: "Coupon code is required",
    });
  }

  const coupon = await Coupon.findOne({
    code: code.toUpperCase(),
    active: true,
  });

  if (!coupon) {
    return res.status(404).json({
      message: "Invalid coupon code",
    });
  }

  // Update coupon status
  coupon.status = getCouponStatus(coupon);
  await coupon.save();

  if (coupon.status === "Scheduled") {
    return res.status(400).json({
      message: "Coupon is not active yet.",
    });
  }

  if (coupon.status === "Expired") {
    return res.status(400).json({
      message: "Coupon has expired.",
    });
  }

  // Check maximum total coupon uses
  if (coupon.usedCount >= coupon.maxUses) {
    return res.status(400).json({
      message: "Coupon usage limit reached.",
    });
  }

  // Check minimum order amount
  if (
    Number(totalAmount) <
    Number(coupon.minimumOrderAmount || 0)
  ) {
    return res.status(400).json({
      message: `Minimum order amount for this coupon is Rs. ${coupon.minimumOrderAmount}`,
    });
  }

  /*
  PRODUCT TYPE VALIDATION
  
  ```
  The checkout/cart should send items like:
  
  items: [
    {
      product: {
        category: {
          name: "Inskirts"
        }
      }
    }
  ]
  ```
  
  */

  if (
    coupon.applicableTo &&
    coupon.applicableTo !== "All Products" &&
    items.length > 0
  ) {
    const hasEligibleProduct = items.some((item) => {
      const categoryName =
        item.product?.category?.name ||
        item.category?.name ||
        item.categoryName ||
        "";


      return (
        categoryName.toLowerCase() ===
        coupon.applicableTo.toLowerCase()
      );
    });

    if (!hasEligibleProduct) {
      return res.status(400).json({
        message: `This coupon is valid only for ${coupon.applicableTo}.`,
      });
    }


  }

  // Calculate discount
  let discount = 0;

  if (coupon.discountType === "Percentage") {
    discount = Math.round(
      (Number(totalAmount) * Number(coupon.discountValue)) / 100
    );

    // Example: 20% OFF up to ₹200
    if (
      Number(coupon.maximumDiscount) > 0 &&
      discount > Number(coupon.maximumDiscount)
    ) {
      discount = Number(coupon.maximumDiscount);
    }

  } else if (coupon.discountType === "Flat") {
    discount = Number(coupon.discountValue);
  } else if (coupon.discountType === "Free Shipping") {
    discount = 0;
  }

  res.json({
    coupon,
    discount: Math.min(discount, Number(totalAmount)),
  });
});

// @route PUT /api/coupons/:id (admin)
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return res.status(404).json({
      message: "Coupon not found",
    });
  }

  Object.assign(coupon, req.body);

  // Safe defaults for old coupons
  if (!coupon.applicableTo) {
    coupon.applicableTo = "All Products";
  }

  if (!coupon.maximumDiscount) {
    coupon.maximumDiscount = 0;
  }

  coupon.status = getCouponStatus(coupon);

  coupon.remainingCount = Math.max(
    Number(coupon.maxUses) - Number(coupon.usedCount),
    0
  );

  await coupon.save();

  res.json({ coupon });
});

// @route DELETE /api/coupons/:id (admin)
const removeCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return res.status(404).json({
      message: "Coupon not found",
    });
  }

  await coupon.deleteOne();

  res.json({
    message: "Coupon deleted successfully",
  });
});

// @route PATCH /api/coupons/:id/toggle (admin)
const toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    return res.status(404).json({
      message: "Coupon not found",
    });
  }

  coupon.active = !coupon.active;

  await coupon.save();

  res.json({
    success: true,
    coupon,
  });
});

module.exports = {
  createCoupon,
  listCoupons,
  getActiveCoupons,
  applyCoupon,
  updateCoupon,
  removeCoupon,
  toggleCouponStatus,
};