import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/MyReturns.css";
import { returnApi } from "../api/endpoints";
import { imageUrl } from "../api/client";
import { useToast } from "../context/ToastContext";

export default function MyReturns() {
    const toast = useToast();

    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadReturns = async () => {
            try {
                setLoading(true);

                const response = await returnApi.myReturns();

                setReturns(response.data.returns || []);
            } catch (error) {
                console.error(error);
                toast.error("Could not load return details.");
                setReturns([]);
            } finally {
                setLoading(false);
            }
        };

        loadReturns();
    }, []);

    if (loading) {
        return <div className="spinner" />;
    }

    return (
        <div className="page-wrap my-returns-page">
            <div className="container">
                <div className="returns-header">
                    <div>
                        <h1>My Returns</h1>
                        <p>Track your return requests and refunds</p>
                    </div>

                    <Link to="/orders" className="btn btn-outline">
                        Back to Orders
                    </Link>
                </div>

                {returns.length === 0 ? (
                    <div className="empty">
                        <h3>No return requests yet</h3>

                        <Link to="/orders" className="btn btn-gold">
                            View My Orders
                        </Link>
                    </div>
                ) : (
                    <div className="returns-list">
                        {returns.map((returnItem) => {
                            const product = returnItem.product;

                            return (
                                <div
                                    className="return-card"
                                    key={returnItem._id}
                                >
                                    <div className="return-product">
                                        <img
                                            src={
                                                product?.colorVariants?.[0]?.images?.[0]
                                                    ? imageUrl(
                                                        product.colorVariants[0].images[0]
                                                    )
                                                    : "https://placehold.co/150x180/efe6d5/3f2317?text=Product"
                                            }
                                            alt={product?.productName || "Product"}
                                        />

                                        <div className="return-product-info">
                                            <h3>
                                                {product?.productName || "Product"}
                                            </h3>

                                            <p>
                                                Return ID: #{returnItem._id?.slice(-8).toUpperCase()}
                                            </p>

                                            <p>
                                                Reason: <strong>{returnItem.reason}</strong>
                                            </p>

                                            <p>
                                                Requested on{" "}
                                                {new Date(
                                                    returnItem.createdAt
                                                ).toLocaleDateString("en-IN", {
                                                    day: "numeric",
                                                    month: "long",
                                                    year: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="return-status-section">
                                        <div>
                                            <span className="return-label">
                                                Return Status
                                            </span>

                                            <strong
                                                className={`return-status ${returnItem.status || "Requested"
                                                    }`}
                                            >
                                                {returnItem.status || "Requested"}
                                            </strong>
                                        </div>

                                        <div>
                                            <span className="return-label">
                                                Refund Status
                                            </span>

                                            <strong>
                                                {returnItem.refundStatus || "Not Started"}
                                            </strong>
                                        </div>

                                        {returnItem.refundAmount > 0 && (
                                            <div>
                                                <span className="return-label">
                                                    Refund Amount
                                                </span>

                                                <strong>
                                                    ₹
                                                    {returnItem.refundAmount.toLocaleString(
                                                        "en-IN"
                                                    )}
                                                </strong>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
