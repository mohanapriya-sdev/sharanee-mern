import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { couponApi } from "../api/endpoints";
import { imageUrl } from "../api/client";
import { Icon } from "../components/Icons";
import { useToast } from "../context/ToastContext";
 
export default function Cart() {
  const { cart, cartTotal, updateQty, removeFromCart } = useCart();
const [code, setCode] = useState("");
const [discount, setDiscount] = useState(0);
const [appliedCode, setAppliedCode] = useState("");
const [coupons, setCoupons] = useState([]);
  const toast = useToast();
  const navigate = useNavigate();
 useEffect(() => {
  const fetchCoupons = async () => {
    try {
    const { data } = await couponApi.active();

      console.log("FULL COUPON RESPONSE:", data);
      console.log("IS ARRAY:", Array.isArray(data));

      if (Array.isArray(data)) {
        setCoupons(data);
      } else {
        setCoupons(data.coupons || data.data || []);
      }
    } catch (err) {
      console.error("Failed to load coupons:", err);
    }
  };

  fetchCoupons();
}, []);

  const priceOf = (p) =>
    p.finalPrice || p.price;

  const applyCoupon = async () => {
    if (!code.trim()) return;
    try {
      const { data } = await couponApi.apply(code.trim(), cartTotal);
      console.log("Coupon Response:", data);
      setDiscount(data.discount);
      setAppliedCode(data.coupon.code);
      toast.success(`Coupon ${data.coupon.code} applied.`);
    } catch (err) {
      setDiscount(0);
      setAppliedCode("");
      toast.error(err.response?.data?.message || "Invalid coupon.");
    }
  };

  const shipping = cartTotal > 999 || cartTotal === 0 ? 0 : 50;
  const grand = Math.max(0, cartTotal - discount) + shipping;

  if (cart.length === 0) {
    return (
      <div className="page-wrap">
        <div className="container empty">
          <h3>Your bag is empty</h3>
          <p>Discover timeless pieces crafted for every celebration.</p>
          <Link to="/shop" className="btn btn-gold" style={{ marginTop: 16 }}>Continue Shopping <Icon.Arrow /></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <div className="crumb" style={{ marginBottom: 24 }}>
        <div className="container"><Link to="/">Home</Link><span className="sep">›</span>Cart</div>
      </div>
      <div className="container">
        <h1 style={{ fontSize: "2.4rem" }}>Shopping Bag</h1>
        <div className="cart-grid">
          <div>
            <table className="cart-table">
              <thead>
                <tr><th>Product</th><th>Price</th><th>Quantity</th><th>Total</th><th></th></tr>
              </thead>
              <tbody>
                {cart.map((item) => {
                  const p = item.product;
                  if (!p) return null;
                  const isPins = p.productType === "Pins";

                  const selectedVariant = !isPins
                    ? p.colorVariants?.find(
                      (variant) => variant.colorName === item.selectedColor
                    )
                    : null;
                  console.log("Selected Variant:", selectedVariant);
                  let img;

                  if (isPins) {
                    // Pins use normal product.images
                    img = p.images?.[0]
                      ? imageUrl(p.images[0])
                      : "https://placehold.co/80x100/efe6d5/3f2317?text=S";
                  } else {
                    // Inskirts use color variant images
                    img = selectedVariant?.images?.[0]
                      ? imageUrl(selectedVariant.images[0])
                      : p.colorVariants?.[0]?.images?.[0]
                        ? imageUrl(p.colorVariants[0].images[0])
                        : "https://placehold.co/80x100/efe6d5/3f2317?text=S";
                  }
                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="cart-prod">
                          <img src={img} alt={p.productName} />
                          <div>
                            <Link to={`/product/${p._id}`}><b>{p.productName}</b></Link>
                            {item.selectedColor && (
                              <small>
                                Color:
                                <span
                                  style={{
                                    display: "inline-block",
                                    width: "12px",
                                    height: "12px",
                                    borderRadius: "50%",
                                    margin: "0 6px",
                                    background:
                                      selectedVariant?.colorCode || "#ccc",
                                    border: "1px solid #ccc",
                                    verticalAlign: "middle",
                                  }}
                                />
                                {item.selectedColor}
                              </small>
                            )}

                            {item.selectedSize && (
                              <small>
                                Size: {item.selectedSize}
                              </small>
                            )}

                            <small>by Sharanee</small>
                          </div>
                        </div>
                      </td>
                      <td className="price">
                        Rs. {priceOf(p).toLocaleString("en-IN")}
                      </td>
                      <td>
                        <div className="qty">
                          <button onClick={() => updateQty(item._id, Math.max(1, item.quantity - 1))}>−</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQty(item._id, item.quantity + 1)}>+</button>
                        </div>
                      </td>
                      <td className="price">Rs. {(priceOf(p) * item.quantity).toLocaleString("en-IN")}</td>
                      <td>
                        <button onClick={() => removeFromCart(item._id)} style={{ background: "none", border: "none", color: "var(--danger)" }}>
                          <Icon.Trash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="summary">
            <h3>Bill Summary</h3>
           <div className="coupon-row">
  <select
    value={code}
    onChange={(e) => setCode(e.target.value)}
  >
    <option value="">Select Coupon</option>

    {coupons.map((coupon) => (
      <option key={coupon._id} value={coupon.code}>
        {coupon.code}
        {coupon.discountType === "percentage"
          ? ` - ${coupon.discountValue}% OFF`
          : ` - ₹${coupon.discountValue} OFF`}
      </option>
    ))}
  </select>

  <button className="btn" onClick={applyCoupon}>
    Apply
  </button>
</div>
            <div className="summary-row"><span>Subtotal</span><span>Rs. {cartTotal.toLocaleString("en-IN")}</span></div>
            {discount > 0 && <div className="summary-row"><span>Discount ({appliedCode})</span><span style={{ color: "var(--danger)" }}>− Rs. {discount.toLocaleString("en-IN")}</span></div>}
            <div className="summary-row"><span>Shipping</span><span>{shipping === 0 ? "Free" : `Rs. ${shipping}`}</span></div>
            <div className="summary-row total"><span>Total</span><span>Rs. {grand.toLocaleString("en-IN")}</span></div>
            <button className="btn btn-gold btn-block" style={{ marginTop: 16 }} onClick={() => navigate("/checkout", { state: { discount, appliedCode, shipping } })}>
              Checkout <Icon.Arrow />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
