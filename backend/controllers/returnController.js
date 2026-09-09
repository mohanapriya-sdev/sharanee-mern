const Return = require("../models/Return");
const asyncHandler = require("../utils/asyncHandler");
const Order = require("../models/Order");
// =====================================================
// CREATE RETURN REQUEST
// POST /api/returns
// Customer
// body: { order, product, reason }
// =====================================================

const createReturn = asyncHandler(async (req, res) => {
  const { order, product, reason } = req.body;

  if (!order || !product || !reason?.trim()) {
    return res.status(400).json({
      message: "Order, product and reason are required",
    });
  }

  // Logged-in customer from JWT
  const userId = req.user._id;
  // Check order belongs to logged-in customer
  const existingOrder = await Order.findOne({
    _id: order,
    user: userId,
  });

  if (!existingOrder) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  // Return allowed only after delivery
  if (existingOrder.orderStatus !== "Delivered") {
    return res.status(400).json({
      message: "Return is allowed only for delivered orders",
    });
  }

  // Check selected product actually belongs to this order
  const productExists = existingOrder.items.some(
    (item) => item.product.toString() === product.toString()
  );

  if (!productExists) {
    return res.status(400).json({
      message: "This product does not belong to the selected order",
    });
  }

  // Prevent duplicate return for same order + product
  const existingReturn = await Return.findOne({
    user: userId,
    order,
    product,
  });

  if (existingReturn) {
    return res.status(400).json({
      message: "Return request already submitted for this product",
    });
  }

  const returnRequest = await Return.create({
    user: userId,
    order,
    product,
    reason: reason.trim(),
  });

  const populatedReturn = await Return.findById(returnRequest._id)
    .populate("user", "fullName email phone")
    .populate("product", "productName price discountPrice images")
    .populate("order");

  res.status(201).json({
    success: true,
    message: "Return request submitted successfully",
    return: populatedReturn,
  });
});


// =====================================================
// GET LOGGED-IN CUSTOMER RETURNS
// GET /api/returns/my
// Customer
// =====================================================

const myReturns = asyncHandler(async (req, res) => {
  const returns = await Return.find({
    user: req.user._id,
  })
    .populate("order")
    .populate(
      "product",
      "productName price discountPrice images"
    )
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: returns.length,
    returns,
  });
});


// =====================================================
// GET ALL RETURNS
// GET /api/returns
// Admin
// =====================================================

const allReturns = asyncHandler(async (req, res) => {
  const returns = await Return.find()
    .populate("user", "fullName email phone")
    .populate({
      path: "order",
      select: "guestDetails items trackingId",
    })
    .populate("product", "productName price discountPrice images")
    .sort({ createdAt: -1 });

  console.log("FIRST RETURN:");
  console.log(JSON.stringify(returns[0], null, 2));

  console.log("TOTAL RETURNS:", returns.length);

  console.log(
    returns.map((r) => ({
      id: r._id,
      guestMobile: r.guestMobile,
      user: r.user,
      guestDetails: r.order?.guestDetails,
      product: r.product?.productName,
    }))
  );

  res.json({
    success: true,
    count: returns.length,
    returns,
  });
});


// =====================================================
// UPDATE RETURN / REFUND
// PUT /api/returns/:id
// Admin
//
// body:
// {
//   status,
//   refundStatus,
//   refundMethod,
//   refundAmount,
//   adminNote
// }
// =====================================================

const updateReturnStatus = asyncHandler(async (req, res) => {
  const {
    status,
    refundStatus,
    refundMethod,
    refundAmount,
    adminRemark,
  } = req.body;

  const returnRequest = await Return.findById(req.params.id);

  if (!returnRequest) {
    return res.status(404).json({
      message: "Return request not found",
    });
  }

  // Return status
  if (status !== undefined) {
    returnRequest.status = status;
  }

  // Refund status
  if (refundStatus !== undefined) {
    returnRequest.refundStatus = refundStatus;
  }

  // Refund method
  if (refundMethod !== undefined) {
    returnRequest.refundMethod = refundMethod;
  }

  // Refund amount
  if (refundAmount !== undefined) {
    const amount = Number(refundAmount);

    if (Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({
        message: "Invalid refund amount",
      });
    }

    returnRequest.refundAmount = amount;
  }

  // Admin note
  if (adminRemark !== undefined) {
    returnRequest.adminRemark = String(adminRemark).trim();
  }
  // Save approval date
  if (status === "Approved") {
    returnRequest.approvedAt = new Date();
  }

  // Save pickup scheduled date
  if (status === "Pickup Scheduled") {
    returnRequest.pickupScheduledAt = new Date();
  }

  // Save picked up date
  if (status === "Picked Up") {
    returnRequest.pickedUpAt = new Date();
  }

  // Save refund date
  if (refundStatus === "Refunded") {
    returnRequest.refundedAt = new Date();

    // Automatically complete the return
    returnRequest.status = "Refunded";
  }

  await returnRequest.save();

  const updatedReturn = await Return.findById(returnRequest._id)
    .populate("user", "fullName email phone")
    .populate(
      "product",
      "productName price discountPrice images"
    )
    .populate("order");

  res.json({
    success: true,
    message: "Return request updated successfully",
    return: updatedReturn,
  });
});
const createGuestReturn = asyncHandler(async (req, res) => {
  const { guestMobile, order, product, reason } = req.body;

  if (!guestMobile || !order || !product || !reason?.trim()) {
    return res.status(400).json({
      message: "Guest mobile, order, product and reason are required",
    });
  }

  const existingOrder = await Order.findOne({
    _id: order,
    "guestDetails.mobile": guestMobile,
  });

  if (!existingOrder) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  if (existingOrder.orderStatus !== "Delivered") {
    return res.status(400).json({
      message: "Return is allowed only after delivery",
    });
  }

  const productExists = existingOrder.items.some(
    (item) => item.product.toString() === product.toString()
  );

  if (!productExists) {
    return res.status(400).json({
      message: "Product not found in this order",
    });
  }

  const alreadyReturned = await Return.findOne({
    guestMobile,
    order,
    product,
  });

  if (alreadyReturned) {
    return res.status(400).json({
      message: "Return already submitted",
    });
  }
  const returnRequest = await Return.create({
    guestMobile,
    order,
    product,
    reason: reason.trim(),
  });

  const populatedReturn = await Return.findById(returnRequest._id)
    .populate("order")
    .populate("product", "productName price discountPrice images");

  res.status(201).json({
    success: true,
    message: "Guest return request submitted successfully",
    return: populatedReturn,
  });
});


const guestReturns = asyncHandler(async (req, res) => {
  const { guestMobile } = req.body;

  if (!guestMobile) {
    return res.status(400).json({
      message: "Guest mobile is required",
    });
  }

  const returns = await Return.find({
    guestMobile,
  })
    .populate("order")
    .populate(
      "product",
      "productName price discountPrice images"
    )
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    count: returns.length,
    returns,
  });
});

module.exports = {
  createReturn,
  createGuestReturn,
  myReturns,
  guestReturns,
  allReturns,
  updateReturnStatus,
};