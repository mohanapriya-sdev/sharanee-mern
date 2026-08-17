import { useEffect, useState } from "react";
import { complaintApi } from "../../api/endpoints";
import { useToast } from "../../context/ToastContext";
import "../../styles/AdminComplaints.css";

export default function AdminComplaints() {
    const toast = useToast();

    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const loadComplaints = async () => {
        try {
            setLoading(true);

            const response = await complaintApi.adminGetAll();

            setComplaints(response.data.complaints || []);
        } catch (error) {
            console.error("Could not load complaints:", error);

            toast.error(
                error.response?.data?.message ||
                "Could not load complaints."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadComplaints();
    }, []);

    const updateStatus = async (id, status) => {
        try {
            setUpdatingId(id);

            await complaintApi.updateStatus(id, status);

            toast.success("Complaint status updated successfully.");

            await loadComplaints();

            if (selectedComplaint?._id === id) {
                setSelectedComplaint((prev) => ({
                    ...prev,
                    status,
                }));
            }
        } catch (error) {
            toast.error(
                error.response?.data?.message ||
                "Could not update complaint status."
            );
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return <div className="admin-complaints-loading">Loading complaints...</div>;
    }

    return (
        <div className="admin-complaints-page">
            <div className="admin-complaints-header">
                <div>
                    <h1>Customer Complaints</h1>
                    <p>View and manage customer complaints</p>
                </div>

                <div className="complaint-count">
                    Total: {complaints.length}
                </div>
            </div>

            {complaints.length === 0 ? (
                <div className="no-complaints">
                    <h3>No complaints found</h3>
                    <p>Customer complaints will appear here.</p>
                </div>
            ) : (
                <div className="complaints-table-wrap">
                    <table className="complaints-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Complaint</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {complaints.map((complaint) => (
                                <tr key={complaint._id}>
                                    <td>
                                        <div className="complaint-customer">
                                            <strong>
                                                {complaint.customer?.fullName || "Customer"}
                                            </strong>

                                            <span>
                                                {complaint.customer?.email || "No email"}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="complaint-message">
                                        {complaint.complaint}
                                    </td>

                                    <td>
                                        {new Date(
                                            complaint.createdAt
                                        ).toLocaleDateString("en-IN")}
                                    </td>

                                    <td>
                                        <span
                                            className={`complaint-status ${(
                                                complaint.status || "Pending"
                                            )
                                                .toLowerCase()
                                                .replace(/\s/g, "-")}`}
                                        >
                                            {complaint.status || "Pending"}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="complaint-actions">
                                            <button
                                                type="button"
                                                className="view-complaint-btn"
                                                onClick={() =>
                                                    setSelectedComplaint(complaint)
                                                }
                                            >
                                                View
                                            </button>

                                            <select
                                                value={complaint.status || "Pending"}
                                                disabled={updatingId === complaint._id}
                                                onChange={(e) =>
                                                    updateStatus(
                                                        complaint._id,
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="In Progress">
                                                    In Progress
                                                </option>
                                                <option value="Resolved">Resolved</option>
                                                <option value="Rejected">Rejected</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {selectedComplaint && (
                <div
                    className="complaint-modal-overlay"
                    onClick={() => setSelectedComplaint(null)}
                >
                    <div
                        className="complaint-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="complaint-modal-header">
                            <div>
                                <h2>Complaint Details</h2>
                                <p>Customer complaint information</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelectedComplaint(null)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="complaint-detail">
                            <span>Customer</span>
                            <strong>
                                {selectedComplaint.customer?.fullName || "Customer"}
                            </strong>
                        </div>

                        <div className="complaint-detail">
                            <span>Email</span>
                            <strong>
                                {selectedComplaint.customer?.email || "Not available"}
                            </strong>
                        </div>

                        <div className="complaint-detail">
                            <span>Complaint</span>
                            <p>{selectedComplaint.complaint}</p>
                        </div>

                        <div className="complaint-detail">
                            <span>Submitted On</span>
                            <strong>
                                {new Date(
                                    selectedComplaint.createdAt
                                ).toLocaleString("en-IN")}
                            </strong>
                        </div>

                        <div className="complaint-detail">
                            <span>Status</span>
                            <strong>{selectedComplaint.status}</strong>
                        </div>

                        <button
                            type="button"
                            className="complaint-close-btn"
                            onClick={() => setSelectedComplaint(null)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}