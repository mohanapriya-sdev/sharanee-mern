import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/MyOrders.css";
import {
  orderApi,
  invoiceApi,
  returnApi,
  cartApi,
  reviewApi,
  complaintApi,
  productApi,
  wishlistApi,
} from "../api/endpoints";
import { imageUrl } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";


export default function MyOrders() {
  const { user } = useAuth();
  const { refreshCart } = useCart();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState("All Orders");
  const [loading, setLoading] = useState(true);
  const [returningItem, setReturningItem] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [myReturns, setMyReturns] = useState([]);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [reviewingItem, setReviewingItem] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [submittingCancel, setSubmittingCancel] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [complaintText, setComplaintText] = useState("");
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [wishlistProductIds, setWishlistProductIds] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const load = () => {
    if (!user?.id) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    orderApi
      .myOrders(user.id)
      .then((response) => {
        const orderList = response.data.orders || [];
        setOrders([...orderList].reverse());
      })
      .catch(() => {
        setOrders([]);
        toast.error("Could not load your orders.");
      })
      .finally(() => {
        setLoading(false);
      });
  };


  const loadReturns = async () => {
    if (!user?.id) {
      setMyReturns([]);
      return;
    }

    try {
      const response = await returnApi.myReturns();
      setMyReturns(response.data.returns || []);
    } catch (error) {
      console.error("Could not load returns:", error);
      setMyReturns([]);
    }
  };

  const loadComplaints = async () => {
    if (!user?.id) {
      setMyComplaints([]);
      return;
    }

    try {
      const response = await complaintApi.myComplaints();

      setMyComplaints(response.data.complaints || []);
    } catch (error) {
      console.error("Could not load complaints:", error);
      setMyComplaints([]);
    }
  };

  const loadRecommendedProducts = async () => {
    try {
      const response = await productApi.list();

      const products =
        response.data.products ||
        response.data ||
        [];

      // Show products that were not already purchased
      const purchasedProductIds = orders
        .flatMap((order) => order.items || [])
        .map((item) =>
          String(
            typeof item.product === "object"
              ? item.product?._id
              : item.product
          )
        );

      const recommendations = products
        .filter(
          (product) =>
            !purchasedProductIds.includes(String(product._id))
        )
        .slice(0, 4);

      setRecommendedProducts(recommendations);
    } catch (error) {
      console.error("Could not load recommended products:", error);
      setRecommendedProducts([]);
    }
  };

  const loadWishlist = async () => {
    if (!user?.id) return;

    try {
      const response = await wishlistApi.get(user.id);

      const wishlist =
        response.data.wishlist ||
        response.data.items ||
        [];

      setWishlistProductIds(
        wishlist.map((item) =>
          String(
            typeof item.product === "object"
              ? item.product?._id
              : item.product
          )
        )
      );
    } catch (error) {
      console.error("Could not load wishlist:", error);
    }
  };
  useEffect(() => {
    load();
    loadReturns();
    loadComplaints();
    loadWishlist();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (orders.length > 0 || !loading) {
      loadRecommendedProducts();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  const submitCancellation = async () => {
    if (!cancellingOrder) return;

    if (!cancelReason.trim()) {
      toast.error("Please select a cancellation reason.");
      return;
    }

    try {
      setSubmittingCancel(true);

      await orderApi.cancel(
        cancellingOrder._id,
        cancelReason.trim()
      );

      toast.success("Order cancelled successfully.");

      setCancellingOrder(null);
      setCancelReason("");

      load();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Could not cancel order."
      );
    } finally {
      setSubmittingCancel(false);
    }
  };
  const downloadInvoice = async (id) => {
    try {
      await invoiceApi.download(id);
    } catch {
      toast.error("Could not download invoice.");
    }
  };


  const handleBuyAgain = async (order) => {
    try {
      for (const item of order.items || []) {
        if (!item.product?._id) continue;

        await cartApi.add(
          user.id,
          item.product._id,
          item.quantity || 1,
          item.selectedColor || null,
          item.selectedSize || null
        );
      }

      await refreshCart();

      toast.success("Products added to cart successfully.");
    } catch (error) {
      console.error("Buy Again error:", error);

      toast.error(
        error.response?.data?.message ||
        "Could not add products to cart."
      );
    }
  };

  const submitReturn = async () => {
    if (!returningItem) return;

    if (!returnReason.trim()) {
      toast.error("Please enter a reason for return.");
      return;
    }

    try {
      setSubmittingReturn(true);

      await returnApi.create({
        order: returningItem.orderId,
        product: returningItem.productId,
        reason: returnReason.trim(),
      });


      toast.success("Return request submitted successfully.");

      setReturningItem(null);
      setReturnReason("");

      await loadReturns();

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Could not submit return request."
      );
    } finally {
      setSubmittingReturn(false);
    }
  };

  const submitReview = async () => {
    if (!reviewingItem) return;

    if (!reviewRating) {
      toast.error("Please select a rating.");
      return;
    }

    try {
      setSubmittingReview(true);

      await reviewApi.add({
        user: user.id,
        product: reviewingItem.productId,
        rating: reviewRating,
        review: reviewText.trim(),
      });

      toast.success("Thank you! Your review was submitted successfully.");

      setReviewingItem(null);
      setReviewRating(5);
      setReviewText("");

      load();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Could not submit review."
      );
    } finally {
      setSubmittingReview(false);
    }
  };


  if (loading) {
    return <div className="spinner" />;
  }


  const filteredOrders =
    selectedStatus === "All Orders"
      ? orders
      : orders.filter(
        (order) => order.orderStatus === selectedStatus
      );
  const handleWishlist = async (product) => {
    if (!user?.id) {
      toast.error("Please login to use wishlist.");
      return;
    }

    try {
      await wishlistApi.add(user.id, product._id);

      setWishlistProductIds((prev) => [
        ...prev,
        String(product._id),
      ]);

      toast.success("Added to wishlist.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Could not add to wishlist."
      );
    }
  };


  const getTrackingDate = (order, status) => {
    const history = order.trackingHistory?.find(
      (item) => item.status === status
    );

    if (!history) return "";

    return new Date(history.date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };


  return (
    <div className="page-wrap my-orders-page">
      <div className="container">
        <div className="orders-page-header">
          <div>
            <h1>My Orders</h1>
            <p>Track, manage and review your orders</p>
          </div>

          <select
            className="order-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All Orders">All Orders</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Packed">Packed</option>
            <option value="Shipped">Shipped</option>
            <option value="Out for Delivery">Out for Delivery</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="empty">
            <h3>No orders yet</h3>

            <Link className="btn btn-gold" to="/shop">
              Start Shopping
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isDelivered = order.orderStatus === "Delivered";
            const isCancelled = order.orderStatus === "Cancelled";
            const orderReturn = myReturns.find((r) => {
              const returnOrderId =
                typeof r.order === "object" ? r.order?._id : r.order;

              return String(returnOrderId) === String(order._id);
            });

            const canCancel = ![
              "Delivered",
              "Cancelled",
              "Shipped",
              "Out for Delivery",
            ].includes(order.orderStatus);

            return (
              <div className="order-card" key={order._id}>
                <div className="order-head">

                  <div className="order-left">

                    <h2 className="order-number">
                      Order #{order._id?.slice(-8).toUpperCase()}
                    </h2>

                    <p>
                      Placed on{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>

                  </div>
                  <div className="order-timeline">

                    <div className="timeline-step active">
                      <div className="circle">📦</div>

                      <span className="step-title">
                        Placed
                      </span>

                      <small className="step-date">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </small>
                    </div>

                    <div className={`line ${["Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered"].includes(order.orderStatus)
                      ? "active"
                      : ""
                      }`} />

                    <div
                      className={`timeline-step ${["Confirmed", "Packed", "Shipped", "Out for Delivery", "Delivered"].includes(
                        order.orderStatus
                      )
                        ? "active"
                        : ""
                        }`}
                    >
                      <div className="circle">✔</div>

                      <span className="step-title">Confirmed</span>

                      <small className="step-date">
                        {getTrackingDate(order, "Confirmed")}
                      </small>
                    </div>

                    <div className={`line ${["Shipped", "Out for Delivery", "Delivered"].includes(order.orderStatus)
                      ? "active"
                      : ""
                      }`} />

                    <div
                      className={`timeline-step ${["Shipped", "Out for Delivery", "Delivered"].includes(order.orderStatus)
                        ? "active"
                        : ""
                        }`}
                    >
                      <div className="circle">🚚</div>

                      <span className="step-title">Shipped</span>

                      <small className="step-date">
                        {getTrackingDate(order, "Shipped")}
                      </small>
                    </div>


                    <div className={`line ${order.orderStatus === "Delivered"
                      ? "active"
                      : ""
                      }`} />

                    <div
                      className={`timeline-step ${order.orderStatus === "Delivered" ? "active" : ""
                        }`}
                    >
                      <div className="circle">✓</div>

                      <span className="step-title">Delivered</span>

                      <small className="step-date">
                        {getTrackingDate(order, "Delivered")}
                      </small>
                    </div>

                  </div>

                  <div className="order-right">

                    <span
                      className={`status-pill status-${order.orderStatus
                        ?.toLowerCase()
                        .replace(/\s+/g, "-")}`}
                    >
                      {order.orderStatus}
                    </span>
                    {isDelivered && order.deliveryDate && (
                      <p className="delivered-date">
                        Delivered on{" "}
                        {new Date(order.deliveryDate).toLocaleDateString("en-IN")}
                      </p>
                    )}

                    <h3 className="order-total">
                      ₹{order.finalAmount?.toLocaleString("en-IN")}
                    </h3>

                  </div>

                </div>

                {order.items?.map((item, index) => {
                  if (!item.product) return null;

                  const returnRequest = myReturns.find((r) => {
                    const returnOrderId =
                      typeof r.order === "object" ? r.order?._id : r.order;

                    const returnProductId =
                      typeof r.product === "object" ? r.product?._id : r.product;

                    return (
                      String(returnOrderId) === String(order._id) &&
                      String(returnProductId) === String(item.product._id)
                    );
                  });

                  return (
                    <div
                      className="order-item premium-product-card"
                      key={item._id || index}
                    >
                      <img
                        src={
                          item.product.colorVariants?.find(
                            (variant) =>
                              variant.colorName?.toLowerCase() ===
                              item.selectedColor?.toLowerCase()
                          )?.images?.[0]
                            ? imageUrl(
                              item.product.colorVariants.find(
                                (variant) =>
                                  variant.colorName?.toLowerCase() ===
                                  item.selectedColor?.toLowerCase()
                              ).images[0]
                            )
                            : item.product.colorVariants?.[0]?.images?.[0]
                              ? imageUrl(item.product.colorVariants[0].images[0])
                              : item.product.images?.[0]
                                ? imageUrl(item.product.images[0])
                                : "https://placehold.co/150x190/efe6d5/3f2317?text=S"
                        }
                        alt={item.product.productName || "Product"}
                      />
                      <div className="premium-product-info">
                        <h3 className="premium-product-title">
                          {item.product.productName}
                        </h3>

                        <div className="premium-rating">
                          ★★★★★
                          <span>(5.0)</span>
                        </div>

                        <div className="product-details-grid">

                          <div className="detail-item">
                            <span className="detail-label">Quantity</span>
                            <p className="detail-value">
                              {item.quantity}
                            </p>
                          </div>

                          <div className="detail-item">
                            <span className="detail-label">Price</span>
                            <p className="detail-value">
                              ₹ {item.price?.toLocaleString("en-IN")}
                            </p>
                          </div>

                          {item.selectedColor && (
                            <div className="detail-item">

                              <span className="detail-label">Color</span>

                              <div className="color-value">

                                <span
                                  className="color-dot"
                                  style={{
                                    background:
                                      item.product.colorVariants?.find(
                                        (variant) =>
                                          variant.colorName?.toLowerCase() ===
                                          item.selectedColor?.toLowerCase()
                                      )?.colorCode || "#ddd",
                                  }}
                                />

                                <span>{item.selectedColor}</span>

                              </div>

                            </div>
                          )}

                          {item.selectedSize && (
                            <div className="detail-item">

                              <span className="detail-label">Size</span>

                              <span className="detail-value">
                                {item.selectedSize}
                              </span>

                            </div>
                          )}

                        </div>

                        <div className="premium-stock">
                          ✓ In Stock
                        </div>

                        {isDelivered && (

                          <div style={{ marginTop: 10 }}>
                            {/*
                            {!returnRequest ? (
                              <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => {
                                  setReturningItem({
                                    orderId: order._id,
                                    productId: item.product._id,
                                    productName: item.product.productName,
                                  });

                                  setReturnReason("");
                                }}
                              >
                                Return Product
                              </button>

                            ) : (
                              <div className="customer-return-status">
                                <span>
                                  Return: <strong>{returnRequest.status}</strong>
                                </span>

                                {returnRequest.refundStatus &&
                                  returnRequest.refundStatus !== "Not Started" && (
                                    <span>
                                      Refund: <strong>{returnRequest.refundStatus}</strong>
                                    </span>
                                  )}

                                {returnRequest.refundAmount > 0 && (
                                  <span>
                                    Refund Amount:{" "}
                                    <strong>
                                      ₹{returnRequest.refundAmount.toLocaleString("en-IN")}
                                    </strong>
                                  </span>
                                )}
                              </div>
                            )}
*/}
                          </div>
                        )}


                      </div>
                    </div>
                  );
                })}


                <div className="order-actions">

                  {isDelivered && (
                    <button
                      type="button"
                      className="btn btn-gold"
                      onClick={() => {
                        const firstProduct = order.items?.find(
                          (item) => item.product?._id
                        );

                        if (!firstProduct) {
                          toast.error("Product details not found.");
                          return;
                        }

                        setReturningItem({
                          orderId: order._id,
                          productId: firstProduct.product._id,
                          productName: firstProduct.product.productName,
                        });

                        setReturnReason("");
                      }}
                    >
                      Return Product
                    </button>
                  )}

                  {/*
                  <button
                    type="button"
                    className="btn btn-gold"
                    onClick={() => handleBuyAgain(order)}
                  >
                    Buy Again
                  </button> */}


                  <Link
                    to={`/orders/${order._id}/track`}
                    className="btn btn-outline"
                  >
                    Track Order
                  </Link>

                  {isDelivered && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => {
                        const firstProduct = order.items?.find(
                          (item) => item.product?._id
                        );

                        if (!firstProduct) {
                          toast.error("Product details not found.");
                          return;
                        }

                        setReviewingItem({
                          orderId: order._id,
                          productId: firstProduct.product._id,
                          productName: firstProduct.product.productName,
                        });

                        setReviewRating(5);
                        setReviewText("");
                      }}
                    >
                      Write Review
                    </button>
                  )}

                  {isDelivered && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => downloadInvoice(order._id)}
                    >
                      Download Invoice
                    </button>
                  )}


                  {canCancel && (
                    <button
                      type="button"
                      className="btn btn-outline btn-danger"
                      onClick={() => {
                        setCancellingOrder(order);
                        setCancelReason("");
                      }}
                    >
                      Cancel Order
                    </button>
                  )}

                </div>

                <div className="order-info-sections">
                  {/* Delivery Details */}
                  <div className="order-info-box">
                    <div className="order-info-icon">🚚</div>

                    <div className="order-info-content">
                      <h4>Delivery Details</h4>

                      <div className="info-row">
                        <span>Courier Partner</span>
                        <strong>{order.courierPartner || "Delivery"}</strong>
                      </div>

                      <div className="info-row">
                        <span>Tracking ID</span>
                        <strong>{order.trackingId || "Not available"}</strong>
                      </div>

                      <div className="info-row">
                        <span>Delivered On</span>
                        <strong>
                          {order.deliveryDate
                            ? new Date(order.deliveryDate).toLocaleDateString("en-IN")
                            : "Not delivered yet"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Return Details */}
                  <div className="order-info-box">
                    <div className="order-info-icon">↩</div>

                    <div className="order-info-content">
                      <h4>Return Details</h4>

                      {orderReturn ? (
                        <>
                          <div className="info-row">
                            <span>Return Status</span>
                            <strong>{orderReturn.status}</strong>
                          </div>

                          <div className="info-row">
                            <span>Reason</span>
                            <strong>{orderReturn.reason}</strong>
                          </div>

                          {orderReturn.adminRemark && (
                            <div className="info-row">
                              <span>Admin Remark</span>
                              <strong>{orderReturn.adminRemark}</strong>
                            </div>
                          )}

                          {orderReturn.approvedAt && (
                            <div className="info-row">
                              <span>Approved On</span>
                              <strong>
                                {new Date(orderReturn.approvedAt).toLocaleDateString("en-IN")}
                              </strong>
                            </div>
                          )}

                          {orderReturn.pickupScheduledAt && (
                            <div className="info-row">
                              <span>Pickup Scheduled</span>
                              <strong>
                                {new Date(orderReturn.pickupScheduledAt).toLocaleDateString("en-IN")}
                              </strong>
                            </div>
                          )}

                          {orderReturn.pickedUpAt && (
                            <div className="info-row">
                              <span>Picked Up On</span>
                              <strong>
                                {new Date(orderReturn.pickedUpAt).toLocaleDateString("en-IN")}
                              </strong>
                            </div>
                          )}

                          {orderReturn.refundStatus &&
                            orderReturn.refundStatus !== "Not Started" && (
                              <div className="info-row">
                                <span>Refund Status</span>
                                <strong>{orderReturn.refundStatus}</strong>
                              </div>
                            )}

                          {orderReturn.refundAmount > 0 && (
                            <div className="info-row">
                              <span>Refund Amount</span>
                              <strong>₹{orderReturn.refundAmount}</strong>
                            </div>
                          )}

                          {orderReturn.refundedAt && (
                            <div className="info-row">
                              <span>Refunded On</span>
                              <strong>
                                {new Date(orderReturn.refundedAt).toLocaleDateString("en-IN")}
                              </strong>
                            </div>
                          )}

                          <button
                            type="button"
                            className="view-return-btn"
                            onClick={() => setSelectedReturn(orderReturn)}
                          >
                            View Return Details →
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="info-row">
                            <span>Return available until</span>
                            <strong>
                              {isDelivered
                                ? "20 days remaining"
                                : "Available after delivery"}
                            </strong>
                          </div>

                          <button className="view-return-btn">
                            No Return Request
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Need Help */}
                  <div className="order-info-box">
                    <div className="order-info-icon">🎧</div>

                    <div className="order-info-content">
                      <h4>Need Help?</h4>
                      <p>We're here to help you</p>

                      <Link to="/contact" className="help-link">
                        Contact Us →
                      </Link>
                      <button
                        type="button"
                        className="help-link"
                        onClick={() => setShowSupportModal(true)}
                      >
                        Contact Support →
                      </button>
                      <button
                        type="button"
                        className="help-link"
                        onClick={() => {
                          setComplaintText("");
                          setShowComplaintModal(true);
                        }}
                      >
                        Raise a Complaint →
                      </button>
                      <button
                        type="button"
                        className="help-link"
                        onClick={() => setSelectedComplaint(myComplaints[0] || null)}
                      >
                        My Complaint Status →
                      </button>
                    </div>
                  </div>
                </div>


              </div>
            );
          })
        )}
      </div>

      {/* RETURN PRODUCT MODAL */}
      {
        returningItem && (
          <div className="return-modal-overlay">
            <div className="return-modal">

              <div className="return-modal-header">
                <div>
                  <h2>Return Product</h2>
                  <p>{returningItem.productName}</p>
                </div>

                <button
                  type="button"
                  className="return-modal-close"
                  onClick={() => {
                    setReturningItem(null);
                    setReturnReason("");
                  }}
                >
                  ×
                </button>
              </div>

              <div className="return-form-group">
                <label>Reason for Return</label>

                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                >
                  <option value="">Select a reason</option>
                  <option value="Product damaged">
                    Product damaged
                  </option>
                  <option value="Wrong product received">
                    Wrong product received
                  </option>
                  <option value="Quality issue">
                    Quality issue
                  </option>
                  <option value="Colour different from expected">
                    Colour different from expected
                  </option>
                  <option value="Product not as expected">
                    Product not as expected
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <div className="return-modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={submittingReturn}
                  onClick={() => {
                    setReturningItem(null);
                    setReturnReason("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-gold"
                  disabled={submittingReturn}
                  onClick={submitReturn}
                >
                  {submittingReturn
                    ? "Submitting..."
                    : "Submit Return"}
                </button>
              </div>

            </div>
          </div>
        )
      }

      {/* CANCEL ORDER MODAL */}
      {
        cancellingOrder && (
          <div className="return-modal-overlay">
            <div className="return-modal">

              <div className="return-modal-header">
                <div>
                  <h2>Cancel Order</h2>
                  <p>
                    Order #{cancellingOrder._id.slice(-8).toUpperCase()}
                  </p>
                </div>

                <button
                  type="button"
                  className="return-modal-close"
                  onClick={() => {
                    setCancellingOrder(null);
                    setCancelReason("");
                  }}
                >
                  ×
                </button>
              </div>

              <div className="return-form-group">
                <label>Reason for Cancellation</label>

                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                >
                  <option value="">Select a reason</option>

                  <option value="Ordered by mistake">
                    Ordered by mistake
                  </option>

                  <option value="Want to change product">
                    Want to change product
                  </option>

                  <option value="Want to change size or colour">
                    Want to change size or colour
                  </option>

                  <option value="Delivery time is too long">
                    Delivery time is too long
                  </option>

                  <option value="Found another product">
                    Found another product
                  </option>

                  <option value="Payment issue">
                    Payment issue
                  </option>

                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>

              <div className="return-modal-actions">

                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={submittingCancel}
                  onClick={() => {
                    setCancellingOrder(null);
                    setCancelReason("");
                  }}
                >
                  Keep Order
                </button>

                <button
                  type="button"
                  className="btn btn-gold"
                  disabled={submittingCancel}
                  onClick={submitCancellation}
                >
                  {submittingCancel
                    ? "Cancelling..."
                    : "Confirm Cancellation"}
                </button>

              </div>

            </div>
          </div>
        )
      }

      {/* REVIEW MODAL */}
      {
        reviewingItem && (
          <div className="return-modal-overlay">
            <div className="return-modal">

              <div className="return-modal-header">
                <div>
                  <h2>Write Review</h2>
                  <p>{reviewingItem.productName}</p>
                </div>

                <button
                  type="button"
                  className="return-modal-close"
                  onClick={() => {
                    setReviewingItem(null);
                    setReviewRating(5);
                    setReviewText("");
                  }}
                >
                  ×
                </button>
              </div>

              <div className="return-form-group">
                <label>Your Rating</label>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    fontSize: 30,
                    cursor: "pointer",
                    marginTop: 8,
                  }}
                >
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onClick={() => setReviewRating(star)}
                      style={{
                        color:
                          star <= reviewRating
                            ? "#d4a017"
                            : "#ddd",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div className="return-form-group">
                <label>Your Review</label>

                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows="5"
                  style={{
                    width: "100%",
                    resize: "vertical",
                  }}
                />
              </div>

              <div className="return-modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={submittingReview}
                  onClick={() => {
                    setReviewingItem(null);
                    setReviewRating(5);
                    setReviewText("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-gold"
                  disabled={submittingReview}
                  onClick={submitReview}
                >
                  {submittingReview
                    ? "Submitting..."
                    : "Submit Review"}
                </button>
              </div>

            </div>
          </div>
        )
      }
      {/* VIEW RETURN DETAILS MODAL */}
      {
        selectedReturn && (
          <div className="return-modal-overlay">
            <div className="return-modal">

              <div className="return-modal-header">
                <div>
                  <h2>Return Details</h2>
                  <p>Track your return request</p>
                </div>

                <button
                  type="button"
                  className="return-modal-close"
                  onClick={() => setSelectedReturn(null)}
                >
                  ×
                </button>
              </div>

              <div className="return-details-modal-content">

                <div className="info-row">
                  <span>Return Status</span>
                  <strong>{selectedReturn.status}</strong>
                </div>

                <div className="info-row">
                  <span>Reason</span>
                  <strong>{selectedReturn.reason}</strong>
                </div>

                {selectedReturn.adminRemark && (
                  <div className="info-row">
                    <span>Admin Remark</span>
                    <strong>{selectedReturn.adminRemark}</strong>
                  </div>
                )}



                {selectedReturn.refundAmount > 0 && (
                  <div className="info-row">
                    <span>Refund Amount</span>
                    <strong>
                      ₹{selectedReturn.refundAmount.toLocaleString("en-IN")}
                    </strong>
                  </div>
                )}

                {selectedReturn.createdAt && (
                  <div className="info-row">
                    <span>Requested On</span>
                    <strong>
                      {new Date(selectedReturn.createdAt).toLocaleDateString("en-IN")}
                    </strong>
                  </div>
                )}
                {selectedReturn.approvedAt && (
                  <div className="info-row">
                    <span>Approved On</span>
                    <strong>
                      {new Date(selectedReturn.approvedAt).toLocaleDateString("en-IN")}
                    </strong>
                  </div>
                )}

                {selectedReturn.pickupScheduledAt && (
                  <div className="info-row">
                    <span>Pickup Scheduled On</span>
                    <strong>
                      {new Date(selectedReturn.pickupScheduledAt).toLocaleDateString("en-IN")}
                    </strong>
                  </div>
                )}

                {selectedReturn.pickedUpAt && (
                  <div className="info-row">
                    <span>Picked Up On</span>
                    <strong>
                      {new Date(selectedReturn.pickedUpAt).toLocaleDateString("en-IN")}
                    </strong>
                  </div>
                )}

                {selectedReturn.refundedAt && (
                  <div className="info-row">
                    <span>Refunded On</span>
                    <strong>
                      {new Date(selectedReturn.refundedAt).toLocaleDateString("en-IN")}
                    </strong>
                  </div>
                )}
              </div>

              <div className="return-modal-actions">
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => setSelectedReturn(null)}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )
      }

      {/* CONTACT SUPPORT MODAL */}
      {
        showSupportModal && (
          <div className="return-modal-overlay">
            <div className="return-modal">
              <div className="return-modal-header">
                <div>
                  <h2>Contact Support</h2>
                  <p>We're here to help you</p>
                </div>

                <button
                  type="button"
                  className="return-modal-close"
                  onClick={() => setShowSupportModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="support-options">
                <p>
                  <strong>Email:</strong> support@sharanee.com
                </p>

                <p>
                  <strong>Phone:</strong> +91 98765 43210
                </p>

                <p>
                  <strong>Support Hours:</strong> Monday – Saturday, 9 AM – 6 PM
                </p>
              </div>

              <div className="return-modal-actions">
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => setShowSupportModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* RAISE COMPLAINT MODAL */}
      {
        showComplaintModal && (
          <div className="return-modal-overlay">
            <div className="return-modal">
              <div className="return-modal-header">
                <div>
                  <h2>Raise a Complaint</h2>
                  <p>Tell us how we can help you</p>
                </div>

                <button
                  type="button"
                  className="return-modal-close"
                  onClick={() => {
                    setShowComplaintModal(false);
                    setComplaintText("");
                  }}
                >
                  ×
                </button>
              </div>

              <div className="return-form-group">
                <label>Your Complaint</label>

                <textarea
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder="Describe your issue..."
                  rows="5"
                  style={{
                    width: "100%",
                    resize: "vertical",
                  }}
                />
              </div>

              <div className="return-modal-actions">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    setShowComplaintModal(false);
                    setComplaintText("");
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={async () => {
                    if (!complaintText.trim()) {
                      toast.error("Please enter your complaint.");
                      return;
                    }

                    try {
                      await complaintApi.create({
                        complaint: complaintText.trim(),
                      });

                      toast.success("Your complaint has been submitted successfully.");

                      setShowComplaintModal(false);
                      setComplaintText("");

                      await loadComplaints();
                    } catch (error) {
                      console.error("Complaint error:", error);

                      toast.error(
                        error.response?.data?.message ||
                        "Could not submit your complaint."
                      );
                    }
                  }}
                >
                  Submit Complaint
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* MY COMPLAINT STATUS MODAL */}
      {
        selectedComplaint && (
          <div className="return-modal-overlay">
            <div className="return-modal">

              <div className="return-modal-header">
                <div>
                  <h2>Complaint Details</h2>
                  <p>Track your complaint status</p>
                </div>

                <button
                  type="button"
                  className="return-modal-close"
                  onClick={() => setSelectedComplaint(null)}
                >
                  ×
                </button>
              </div>

              <div className="return-details-modal-content">

                <div className="info-row">
                  <span>Complaint</span>
                  <strong>{selectedComplaint.complaint}</strong>
                </div>

                <div className="info-row">
                  <span>Status</span>
                  <strong>{selectedComplaint.status}</strong>
                </div>

                {selectedComplaint.createdAt && (
                  <div className="info-row">
                    <span>Submitted On</span>
                    <strong>
                      {new Date(
                        selectedComplaint.createdAt
                      ).toLocaleDateString("en-IN")}
                    </strong>
                  </div>
                )}

              </div>

              <div className="return-modal-actions">
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => setSelectedComplaint(null)}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        )
      }

      {/*
      {recommendedProducts.length > 0 && (
        <section className="you-may-also-like">

          <div className="recommendation-header">
            <h2>You May Also Like</h2>

            <Link to="/shop" className="view-all-link">
              View All →
            </Link>
          </div>

          <div className="recommendation-grid">
            {recommendedProducts.map((product) => {
              const firstImage =
                product.colorVariants?.[0]?.images?.[0] ||
                product.images?.[0] ||
                product.image;

              const productImage = firstImage
                ? imageUrl(firstImage)
                : "https://placehold.co/300x380/efe6d5/3f2317?text=No+Image";
              const isWishlisted = wishlistProductIds.includes(
                String(product._id)
              );

              return (
                <div
                  className="recommendation-card"
                  key={product._id}
                >
                  <button
                    type="button"
                    className={`recommendation-wishlist ${isWishlisted ? "active" : ""
                      }`}
                    onClick={() => handleWishlist(product)}
                    aria-label="Add to wishlist"
                  >
                    {isWishlisted ? "♥" : "♡"}
                  </button>

                  <Link to={`/product/${product._id}`}>
                    <img
                      src={productImage}
                      alt={product.productName}
                      className="recommendation-image"
                    />
                  </Link>

                  <div className="recommendation-info">
                    <Link
                      to={`/product/${product._id}`}
                      className="recommendation-name"
                    >
                      {product.productName}
                    </Link>

                    <div className="recommendation-price">
                      ₹
                      {(
                        product.discountPrice ||
                        product.price ||
                        0
                      ).toLocaleString("en-IN")}
                    </div>

                    <button
                      type="button"
                      className="recommendation-cart-btn"
                      onClick={async () => {
                        try {
                          await cartApi.add(
                            user.id,
                            product._id,
                            1
                          );

                          await refreshCart();

                          toast.success(
                            "Product added to cart."
                          );
                        } catch (error) {
                          toast.error(
                            error.response?.data?.message ||
                            "Could not add product to cart."
                          );
                        }
                      }}
                    >
                      ADD TO CART
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </section>
      )}

*/}
      <section className="order-benefits">
        <div className="benefit-item">
          <span className="benefit-icon">🚚</span>
          <div>
            <strong>Free Shipping</strong>
            <p>On orders above ₹999</p>
          </div>
        </div>

        <div className="benefit-item">
          <span className="benefit-icon">↩</span>
          <div>
            <strong>7 Day Easy Returns</strong>
            <p>No questions asked</p>
          </div>
        </div>

        <div className="benefit-item">
          <span className="benefit-icon">🛡</span>
          <div>
            <strong>Secure Payments</strong>
            <p>100% safe & secure</p>
          </div>
        </div>

        <div className="benefit-item">
          <span className="benefit-icon">🎧</span>
          <div>
            <strong>Customer Support</strong>
            <p>We're here to help</p>
          </div>
        </div>
      </section>

    </div >
  );
}