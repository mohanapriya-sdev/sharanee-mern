const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");

const ORDER_STATUSES = [
  "Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
];

const PAYMENT_STATUSES = ["Pending", "Paid", "Failed"];

const PAYMENT_METHODS = ["COD", "Card", "UPI", "NetBanking"];

/**
 * Check whether a value is a valid MongoDB ObjectId.
 */
const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value);


/**
 * Generate automatic tracking ID.
 *
 * Format:
 * DDMMYYYY + 3 digit daily order count
 *
 * Example:
 * 11082026001
 * 11082026002
 * 11082026003
 */
const generateTrackingId = async () => {
  const now = new Date();

  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();

  // Start of today
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // Start of tomorrow
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  // Count today's orders
  const todayOrderCount = await Order.countDocuments({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  });

  const orderNumber = String(todayOrderCount + 1).padStart(3, "0");

  return `${day}${month}${year}${orderNumber}`;
};

/**
 * Adjust product stock and keep Product model stock status in sync.
 *
 * Product.save() is intentionally used so Product model middleware,
 * including stockStatus calculation, can run.
 */
const adjustStock = async (productId, delta) => {
  if (!productId || !isValidObjectId(productId)) {
    return;
  }

  const product = await Product.findById(productId);

  if (!product) {
    return;
  }

  const currentStock = Number(product.stock || 0);
  const stockChange = Number(delta || 0);

  product.stock = Math.max(0, currentStock + stockChange);

  await product.save();
};

/**
 * Create a notification without causing the main order operation to fail
 * when notification creation has an issue.
 */
const createNotificationSafely = async ({ title, message }) => {
  try {
    await Notification.create({
      title,
      message,
    });
  } catch (error) {
    console.error("Notification creation failed:", error.message);
  }
};

/**
 * @desc   Place a new order
 * @route  POST /api/orders
 * @access Private
 *
 * Body:
 * {
 *   user,
 *   items,
 *   shippingAddress,
 *   totalAmount,
 *   paymentMethod,
 *   couponCode,
 *   discount,
 *   finalAmount
 * }
 */
const placeOrder = asyncHandler(async (req, res) => {
  const {
    user,
    items,
    shippingAddress,
    totalAmount,
    paymentMethod = "COD",
    couponCode = "",
  } = req.body;
  /*
   * Prefer authenticated user ID when protect middleware sets req.user.
   * Falls back to the existing body user value for compatibility.
   */
  const authenticatedUserId =
    req.user?._id ||
    req.user?.id ||
    user;

  if (!authenticatedUserId) {
    return res.status(400).json({
      success: false,
      message: "User is required",
    });
  }

  if (!isValidObjectId(authenticatedUserId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  if (!shippingAddress) {
    return res.status(400).json({
      success: false,
      message: "Shipping address is required",
    });
  }

  if (!isValidObjectId(shippingAddress)) {
    return res.status(400).json({
      success: false,
      message: "Invalid shipping address ID",
    });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one order item is required",
    });
  }

  if (!PAYMENT_METHODS.includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment method",
    });
  }

  const parsedTotalAmount = Number(totalAmount);

  if (
    !Number.isFinite(parsedTotalAmount) ||
    parsedTotalAmount <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "A valid total amount is required",
    });
  }

  /*
   * Validate every order item before creating the order.
   */
  for (const item of items) {
    if (!item.product || !isValidObjectId(item.product)) {
      return res.status(400).json({
        success: false,
        message: "Each item must contain a valid product ID",
      });
    }

    const quantity = Number(item.quantity);
    const price = Number(item.price);

    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Each item quantity must be at least 1",
      });
    }

    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Each item must contain a valid price",
      });
    }
  }

  /*
   * Verify product availability before creating the order.
   */
  const productIds = items.map((item) => item.product);

  const availableProducts = await Product.find({
    _id: { $in: productIds },
  }).select("_id productName stock");

  const productMap = new Map(
    availableProducts.map((product) => [
      product._id.toString(),
      product,
    ])
  );

  for (const item of items) {
    const product = productMap.get(item.product.toString());

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found: ${item.product}`,
      });
    }

    if (Number(product.stock || 0) < Number(item.quantity)) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${product.productName || "selected product"
          }`,
      });
    }
  }

  let couponDiscount = 0;
  let validCoupon = null;

  if (couponCode && couponCode.trim()) {
    validCoupon = await Coupon.findOne({
      code: couponCode.trim().toUpperCase(),
      active: true,
    });

    if (!validCoupon) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    const today = new Date();

    if (today < validCoupon.startDate) {
      return res.status(400).json({
        success: false,
        message: "Coupon is not active yet",
      });
    }

    if (today > validCoupon.expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired",
      });
    }

    if (validCoupon.usedCount >= validCoupon.maxUses) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit reached",
      });
    }

    if (parsedTotalAmount < validCoupon.minimumOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount for this coupon is Rs. ${validCoupon.minimumOrderAmount}`,
      });
    }

    if (validCoupon.discountType === "Percentage") {
      couponDiscount = Math.round(
        (parsedTotalAmount * validCoupon.discountValue) / 100
      );
    } else if (validCoupon.discountType === "Flat") {
      couponDiscount = validCoupon.discountValue;
    } else if (validCoupon.discountType === "Free Shipping") {
      couponDiscount = 0;
    }

    couponDiscount = Math.min(couponDiscount, parsedTotalAmount);
  }

  const calculatedFinalAmount = Math.max(
    0,
    parsedTotalAmount - couponDiscount
  );

  const normalizedItems = items.map((item) => ({
    product: item.product,
    quantity: Number(item.quantity),
    price: Number(item.price),

    selectedColor:
      item.selectedColor ||
      item.color ||
      item.productColor ||
      "",

    selectedSize:
      item.selectedSize ||
      item.size ||
      item.productSize ||
      "",
  }));

  console.log(
    "ORDER ITEMS RECEIVED:",
    JSON.stringify(items, null, 2)
  );

  console.log(
    "NORMALIZED ORDER ITEMS:",
    JSON.stringify(normalizedItems, null, 2)
  );


  /* AUTOMATIC TRACKING DETAILS */
  const trackingId = await generateTrackingId();

  const courierName = "Delhivery";

  const order = await Order.create({
    user: authenticatedUserId,
    items: normalizedItems,
    shippingAddress,
    totalAmount: parsedTotalAmount,
    couponCode: validCoupon ? validCoupon.code : "",
    discount: couponDiscount,
    finalAmount: calculatedFinalAmount,
    paymentMethod,
    paymentStatus:
      paymentMethod === "COD" ? "Pending" : "Paid",
    orderStatus: "Placed",

    // Automatically generated
    trackingId: trackingId,
    courierName: courierName,
  });
  if (validCoupon) {
    validCoupon.usedCount += 1;

    validCoupon.remainingCount = Math.max(
      validCoupon.maxUses - validCoupon.usedCount,
      0
    );

    await validCoupon.save();
  }

  try {
    await Promise.all(
      normalizedItems.map((item) =>
        adjustStock(item.product, -item.quantity)
      )
    );
  } catch (error) {

    console.error("STOCK UPDATE ERROR:", error);
    /*
     * Remove the newly-created order if stock update fails.
     * This prevents an order from remaining without stock deduction.
     */
    await Order.findByIdAndDelete(order._id);

    return res.status(500).json({
      success: false,
      message: "Unable to update product stock",
    });
  }

  await createNotificationSafely({
    title: "🛒 New Order",
    message: `A new order (${order._id}) has been placed.`,
  });

  await order.populate([
    {
      path: "items.product",
    },
    {
      path: "shippingAddress",
    },
    {
      path: "user",
      select: "fullName name email phone",
    },
  ]);

  return res.status(201).json({
    success: true,
    message: "Order placed successfully",
    order,
  });
});

/**
 * @desc   Get orders belonging to a customer
 * @route  GET /api/orders/user/:userId
 * @access Private
 */
const myOrders = asyncHandler(async (req, res) => {
  const requestedUserId =
    req.params.userId ||
    req.user?._id ||
    req.user?.id;

  if (!requestedUserId || !isValidObjectId(requestedUserId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID",
    });
  }

  const orders = await Order.find({
    user: requestedUserId,
  })
    .populate([
      {
        path: "items.product",
      },
      {
        path: "shippingAddress",
      },
    ])
    .sort({
      createdAt: -1,
    });

  return res.status(200).json({
    success: true,
    count: orders.length,
    orders,
  });
});

/**
 * @desc   Get a single order
 * @route  GET /api/orders/:id
 * @access Private
 */
const getOrder = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
  }

  const order = await Order.findById(req.params.id).populate([
    {
      path: "items.product",
    },
    {
      path: "shippingAddress",
    },
    {
      path: "user",
      select: "fullName name email phone",
    },
  ]);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  return res.status(200).json({
    success: true,
    order,
  });
});

/**
 * @desc   Cancel an order
 * @route  PUT /api/orders/cancel/:id
 * @access Private
 */
const cancelOrder = asyncHandler(async (req, res) => {

  const cancellationReason = String(
    req.body.cancellationReason || ""
  ).trim();

  if (!cancellationReason) {
    return res.status(400).json({
      success: false,
      message: "Cancellation reason is required",
    });
  }

  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
  }

  const order = await Order.findOne({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found or you are not allowed to cancel this order",
    });
  }


  if (order.orderStatus === "Cancelled") {
    return res.status(400).json({
      success: false,
      message: "Order is already cancelled",
    });
  }

  const nonCancellableStatuses = [
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];

  if (nonCancellableStatuses.includes(order.orderStatus)) {
    return res.status(400).json({
      success: false,
      message: `Order cannot be cancelled once it is ${order.orderStatus}`,
    });
  }

  /*
   * Do not manually push into trackingHistory here.
   * The Order model pre-save middleware automatically adds it when
   * orderStatus changes.
   */

  order.orderStatus = "Cancelled";
  order.cancellationReason = cancellationReason;
  order.cancelledAt = new Date();

  await order.save();


  /*
   * Restore stock only after the order has successfully changed to
   * Cancelled. The early check prevents multiple stock restorations.
   */
  await Promise.all(
    order.items.map((item) =>
      adjustStock(item.product, Number(item.quantity))
    )
  );

  await createNotificationSafely({
    title: "🚫 Order Cancelled",
    message: `Order ${order._id} has been cancelled by the customer.`,
  });

  await order.populate([
    {
      path: "items.product",
    },
    {
      path: "shippingAddress",
    },
  ]);

  return res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    order,
  });
});

/**
 * @desc   Get order tracking details
 * @route  GET /api/orders/tracking/:id
 * @access Private
 */
const getTracking = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
  }

  /*
   * lean() ensures the latest plain MongoDB result is returned.
   * sort() keeps tracking history in correct chronological order.
   */
  const order = await Order.findById(req.params.id)
    .select(
      "_id orderStatus trackingId courierName trackingHistory paymentStatus deliveryDate createdAt updatedAt"
    )
    .lean();

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  const trackingHistory = Array.isArray(order.trackingHistory)
    ? [...order.trackingHistory].sort(
      (firstEntry, secondEntry) =>
        new Date(firstEntry.date).getTime() -
        new Date(secondEntry.date).getTime()
    )
    : [];

  return res.status(200).json({
    success: true,

    /*
     * Existing frontend may expect data.tracking.
     */
    tracking: {
      ...order,
      trackingHistory,
    },

    /*
     * This also makes the response easier for frontend pages that expect
     * data.order.
     */
    order: {
      ...order,
      trackingHistory,
    },
  });
});

/**
 * @desc   Update order tracking details
 * @route  PUT /api/orders/tracking/:id
 * @access Admin
 *
 * Body:
 * {
 *   status,
 *   note,
 *   trackingId,
 *   courierName,
 *   paymentStatus,
 *   deliveryDate
 * }
 */
const updateTracking = asyncHandler(async (req, res) => {
  if (!isValidObjectId(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID",
    });
  }

  const {
    status,
    note,
    trackingId,
    courierName,
    paymentStatus,
    deliveryDate,
  } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  const previousStatus = order.orderStatus;

  if (status !== undefined) {
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status. Allowed statuses: ${ORDER_STATUSES.join(
          ", "
        )}`,
      });
    }

    /*
     * Delivered and Cancelled orders should not move to another status.
     */
    if (
      previousStatus === "Delivered" &&
      status !== "Delivered"
    ) {
      return res.status(400).json({
        success: false,
        message: "A delivered order status cannot be changed",
      });
    }

    if (
      previousStatus === "Cancelled" &&
      status !== "Cancelled"
    ) {
      return res.status(400).json({
        success: false,
        message: "A cancelled order status cannot be changed",
      });
    }

    order.orderStatus = status;
  }

  if (trackingId !== undefined) {
    order.trackingId = String(trackingId || "").trim();
  }

  if (courierName !== undefined) {
    order.courierName = String(courierName || "").trim();
  }

  if (paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Allowed statuses: ${PAYMENT_STATUSES.join(
          ", "
        )}`,
      });
    }

    order.paymentStatus = paymentStatus;
  }

  if (
    deliveryDate !== undefined &&
    deliveryDate !== null &&
    deliveryDate !== ""
  ) {
    const parsedDeliveryDate = new Date(deliveryDate);

    if (Number.isNaN(parsedDeliveryDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery date",
      });
    }

    order.deliveryDate = parsedDeliveryDate;
  }

  /*
   * When Delivered is selected and no date is provided,
   * automatically use the current date and time.
   */
  if (
    status === "Delivered" &&
    (
      deliveryDate === undefined ||
      deliveryDate === null ||
      deliveryDate === ""
    )
  ) {
    order.deliveryDate = new Date();
  }

  /*
   * Save first so Order model pre-save middleware can automatically
   * create the trackingHistory entry.
   */
  await order.save();

  /*
   * The model automatically creates the status entry.
   * Update only that latest entry's note when admin supplied a note.
   */
  if (
    status &&
    status !== previousStatus &&
    note !== undefined &&
    order.trackingHistory.length > 0
  ) {
    const latestHistory =
      order.trackingHistory[
      order.trackingHistory.length - 1
      ];

    if (latestHistory.status === status) {
      latestHistory.note =
        String(note || "").trim() ||
        `Order status updated to ${status}`;

      await order.save();
    }
  }

  /*
   * If admin cancels the order, restore stock only when it has just
   * changed from a non-cancelled status to Cancelled.
   */
  if (
    status === "Cancelled" &&
    previousStatus !== "Cancelled"
  ) {
    await Promise.all(
      order.items.map((item) =>
        adjustStock(item.product, Number(item.quantity))
      )
    );
  }

  if (status && status !== previousStatus) {
    await createNotificationSafely({
      title: "📦 Order Status Updated",
      message: `Order ${order._id} status has been updated to ${status}.`,
    });
  }

  await order.populate([
    {
      path: "items.product",
    },
    {
      path: "shippingAddress",
    },
    {
      path: "user",
      select: "fullName name email phone",
    },
  ]);

  return res.status(200).json({
    success: true,
    message: "Order tracking updated successfully",
    order,
    tracking: order,
  });
});

module.exports = {
  placeOrder,
  myOrders,
  getOrder,
  cancelOrder,
  getTracking,
  updateTracking,
};