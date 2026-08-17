import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { contactApi } from "../api/endpoints";
import { useToast } from "../context/ToastContext";
import "../styles/MyMessages.css";
export default function MyMessages() {
    const toast = useToast();

    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadMessages = async () => {
        try {
            setLoading(true);

            const response = await contactApi.myMessages();

            setMessages(response.data.contacts || []);
        } catch (error) {
            console.error("Load my messages error:", error);

            toast.error(
                error.response?.data?.message ||
                "Failed to load your messages"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMessages();
    }, []);

    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString();
    };

    return (
        <>
            {/* Breadcrumb */}
            <div className="crumb">
                <div className="container">
                    <Link to="/">Home</Link>

                    <span className="sep">›</span>

                    <span>My Messages</span>
                </div>
            </div>

            <div className="page-wrap">
                <div className="container">
                    <div className="my-messages-page">

                        {/* Header */}
                        <div className="my-messages-header">
                            <div>
                                <span className="eyebrow">
                                    Customer Support
                                </span>

                                <h1>My Messages</h1>

                                <p>
                                    View your enquiries and replies from
                                    SHARANEE.
                                </p>
                            </div>

                            <Link
                                to="/contact"
                                className="btn btn-gold"
                            >
                                New Message
                            </Link>
                        </div>

                        {/* Loading */}
                        {loading ? (
                            <div className="my-messages-empty">
                                Loading your messages...
                            </div>
                        ) : messages.length === 0 ? (
                            /* No Messages */
                            <div className="my-messages-empty">
                                <h3>No Messages Yet</h3>

                                <p>
                                    You haven't sent any support messages
                                    from this account yet.
                                </p>

                                <Link
                                    to="/contact"
                                    className="btn btn-gold"
                                >
                                    Contact Us
                                </Link>
                            </div>
                        ) : (
                            /* Messages */
                            <div className="my-messages-list">
                                {messages.map((message) => (
                                    <div
                                        className="my-message-card"
                                        key={message._id}
                                    >
                                        {/* Top */}
                                        <div className="my-message-top">
                                            <div>
                                                <h3>{message.subject}</h3>

                                                <span className="my-message-date">
                                                    Sent:{" "}
                                                    {formatDate(
                                                        message.createdAt
                                                    )}
                                                </span>
                                            </div>

                                            <span
                                                className={`my-message-status status-${message.status?.toLowerCase()}`}
                                            >
                                                {message.status}
                                            </span>
                                        </div>

                                        {/* Customer Message */}
                                        <div className="my-message-section">
                                            <span className="my-message-label">
                                                Your Message
                                            </span>

                                            <p>{message.comment}</p>
                                        </div>

                                        {/* Admin Reply */}
                                        {message.adminReply ? (
                                            <div className="sharanee-reply">
                                                <div className="sharanee-reply-title">
                                                    SHARANEE Reply
                                                </div>

                                                <p>
                                                    {message.adminReply}
                                                </p>

                                                {message.repliedAt && (
                                                    <span className="reply-date">
                                                        Replied:{" "}
                                                        {formatDate(
                                                            message.repliedAt
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="awaiting-reply">
                                                {message.status === "Read"
                                                    ? "Our team has read your message. A reply will be sent shortly."
                                                    : "Your message has been received. Our team will review it shortly."}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}