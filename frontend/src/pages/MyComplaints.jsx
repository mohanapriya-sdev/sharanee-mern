import { useEffect, useState } from "react";
import "../styles/MyComplaints.css";
import { complaintApi } from "../api/endpoints";
import { useToast } from "../context/ToastContext";

export default function MyComplaints() {
    const toast = useToast();

    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);

    const loadComplaints = async () => {
        try {
            setLoading(true);

            const response = await complaintApi.myComplaints();

            setComplaints(response.data.complaints || []);
        } catch (error) {
            console.error("Could not load complaints:", error);

            toast.error(
                error.response?.data?.message ||
                "Could not load your complaints."
            );

            setComplaints([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadComplaints();
    }, []);

    if (loading) {
        return <div className="spinner" />;
    }

    return (
        <div className="my-complaints-page">
            <div className="container">

                <div className="complaints-header">
                    <div>
                        <h1>My Complaints</h1>
                        <p>Track and manage your complaints</p>
                    </div>

                    <div className="complaints-count">
                        Total: {complaints.length}
                    </div>
                </div>

                {complaints.length === 0 ? (
                    <div className="complaints-empty">
                        <h3>No complaints yet</h3>
                        <p>You haven't raised any complaints.</p>
                    </div>
                ) : (
                    <div className="complaints-table-card">

                        <div className="complaints-table-head">
                            <div>COMPLAINT</div>
                            <div>DATE</div>
                            <div>STATUS</div>
                            <div>ACTION</div>
                        </div>

                        {complaints.map((item) => (
                            <div
                                className="complaints-table-row"
                                key={item._id}
                            >
                                <div className="complaint-message">
                                    {item.complaint}
                                </div>

                                <div className="complaint-date">
                                    {new Date(item.createdAt).toLocaleDateString(
                                        "en-IN",
                                        {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        }
                                    )}
                                </div>

                                <div>
                                    <span
                                        className={`complaint-status ${item.status
                                            .toLowerCase()
                                            .replace(/\s+/g, "-")}`}
                                    >
                                        {item.status}
                                    </span>
                                </div>

                                <div>
                                    <button
                                        type="button"
                                        className="view-complaint-btn"
                                        onClick={() => setSelectedComplaint(item)}
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                        ))}

                    </div>
                )}

            </div>

            {/* COMPLAINT DETAILS MODAL */}
            {selectedComplaint && (
                <div className="complaint-modal-overlay">

                    <div className="complaint-modal">

                        <div className="complaint-modal-header">
                            <div>
                                <h2>Complaint Details</h2>
                                <p>Track your complaint status</p>
                            </div>

                            <button
                                type="button"
                                className="complaint-modal-close"
                                onClick={() => setSelectedComplaint(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="complaint-details">

                            <div className="complaint-detail-item">
                                <span>Complaint</span>
                                <strong>{selectedComplaint.complaint}</strong>
                            </div>

                            <div className="complaint-detail-item">
                                <span>Status</span>
                                <strong>{selectedComplaint.status}</strong>
                            </div>

                            <div className="complaint-detail-item">
                                <span>Submitted On</span>
                                <strong>
                                    {new Date(
                                        selectedComplaint.createdAt
                                    ).toLocaleDateString("en-IN")}
                                </strong>
                            </div>

                        </div>

                        <div className="complaint-modal-actions">
                            <button
                                type="button"
                                onClick={() => setSelectedComplaint(null)}
                            >
                                CLOSE
                            </button>
                        </div>

                    </div>

                </div>
            )}
        </div>
    );
}