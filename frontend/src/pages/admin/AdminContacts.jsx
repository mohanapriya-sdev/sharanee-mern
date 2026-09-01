import {
    Fragment,
    useEffect,
    useState,
} from "react";
import { contactApi } from "../../api/endpoints";
import { useToast } from "../../context/ToastContext";
import "../../styles/AdminContacts.css";

export default function AdminContacts() {
    const toast = useToast();

    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    // Reply states
    const [replyingId, setReplyingId] = useState(null);
    const [replyText, setReplyText] = useState("");
    const [sendingReply, setSendingReply] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 5;

    // =========================
    // Load Contact Messages
    // =========================
    const loadContacts = async () => {
        try {
            setLoading(true);

            const response = await contactApi.getAll();
            setContacts(response.data.contacts || []);
            setCurrentPage(1);
        } catch (error) {
            console.error("Load contacts error:", error);

            toast.error(
                error.response?.data?.message ||
                "Failed to load contact messages"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContacts();
    }, []);


    const totalPages = Math.ceil(
        contacts.length / itemsPerPage
    );

    const currentContacts = contacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );


    // =========================
    // Update Status
    // =========================
    const handleStatusChange = async (id, status) => {
        try {
            setUpdatingId(id);

            const response = await contactApi.updateStatus(
                id,
                status
            );

            setContacts((prev) =>
                prev.map((contact) =>
                    contact._id === id
                        ? response.data.contact
                        : contact
                )
            );

            toast.success("Contact status updated successfully");
        } catch (error) {
            console.error("Update contact status error:", error);

            toast.error(
                error.response?.data?.message ||
                "Failed to update status"
            );
        } finally {
            setUpdatingId(null);
        }
    };

    // =========================
    // Open Reply Box
    // =========================
    const handleOpenReply = async (contact) => {
        setReplyingId(contact._id);
        setReplyText(contact.adminReply || "");

        // When admin opens a New message for replying,
        // automatically mark it as Read.
        if (contact.status === "New") {
            try {
                const response = await contactApi.updateStatus(
                    contact._id,
                    "Read"
                );

                setContacts((prev) =>
                    prev.map((item) =>
                        item._id === contact._id
                            ? response.data.contact
                            : item
                    )
                );
            } catch (error) {
                console.error("Mark contact as read error:", error);
            }
        }
    };

    // =========================
    // Close Reply Box
    // =========================
    const handleCancelReply = () => {
        setReplyingId(null);
        setReplyText("");
    };

    // =========================
    // Send Actual Reply
    // =========================
    const handleSendReply = async (id) => {
        if (!replyText.trim()) {
            toast.error("Please enter a reply message");
            return;
        }

        try {
            setSendingReply(true);

            const response = await contactApi.reply(
                id,
                replyText.trim()
            );

            setContacts((prev) =>
                prev.map((contact) =>
                    contact._id === id
                        ? response.data.contact
                        : contact
                )
            );

            toast.success(
                response.data.message ||
                "Reply sent successfully"
            );

            setReplyingId(null);
            setReplyText("");
        } catch (error) {
            console.error("Send reply error:", error);

            toast.error(
                error.response?.data?.message ||
                "Failed to send reply"
            );
        } finally {
            setSendingReply(false);
        }
    };

    // =========================
    // Delete Contact
    // =========================
    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this contact message?"
        );

        if (!confirmed) return;

        try {
            await contactApi.remove(id);

            setContacts((prev) =>
                prev.filter((contact) => contact._id !== id)
            );

            if (replyingId === id) {
                setReplyingId(null);
                setReplyText("");
            }

            toast.success("Contact message deleted successfully");
        } catch (error) {
            console.error("Delete contact error:", error);

            toast.error(
                error.response?.data?.message ||
                "Failed to delete contact message"
            );
        }
    };

    // =========================
    // Format Date
    // =========================
    const formatDate = (date) => {
        if (!date) return "-";

        return new Date(date).toLocaleString();
    };

    return (
        <div className="admin-contacts-page">
            <div className="admin-contacts-header">
                <div>
                    <h1>Contact Messages</h1>
                    <p>
                        View and manage customer enquiries and messages.
                    </p>
                </div>
            </div>

            <div className="admin-contacts-card">
                {loading ? (
                    <div className="contacts-loading">
                        Loading contact messages...
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="contacts-empty">
                        No contact messages found.
                    </div>
                ) : (
                    <div className="contacts-table-wrapper">
                        <table className="contacts-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Contact</th>
                                    <th>Subject</th>
                                    <th>Message</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                {currentContacts.map((contact) => (
                                    <Fragment key={contact._id}>
                                        <tr key={contact._id}>
                                            <td>
                                                <strong>{contact.name}</strong>
                                            </td>

                                            <td>
                                                <div>{contact.email}</div>
                                                <div>{contact.phone}</div>
                                            </td>

                                            <td>{contact.subject}</td>

                                            <td>
                                                <div className="contact-message">
                                                    {contact.comment}
                                                </div>
                                            </td>

                                            <td>
                                                {formatDate(contact.createdAt)}
                                            </td>

                                            <td>
                                                <select
                                                    className={`contact-status status-${contact.status?.toLowerCase()}`}
                                                    value={contact.status}
                                                    disabled={
                                                        updatingId === contact._id
                                                    }
                                                    onChange={(e) =>
                                                        handleStatusChange(
                                                            contact._id,
                                                            e.target.value
                                                        )
                                                    }
                                                >
                                                    <option value="New">New</option>
                                                    <option value="Read">Read</option>

                                                    {contact.status === "Replied" && (
                                                        <option value="Replied">
                                                            Replied
                                                        </option>
                                                    )}
                                                </select>
                                            </td>

                                            <td>
                                                <div className="contact-actions">
                                                    <button
                                                        type="button"
                                                        className="contact-reply-btn"
                                                        onClick={() =>
                                                            handleOpenReply(contact)
                                                        }
                                                    >
                                                        {contact.status === "Replied"
                                                            ? "View Reply"
                                                            : "Reply"}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="contact-delete-btn"
                                                        onClick={() =>
                                                            handleDelete(contact._id)
                                                        }
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                    </Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>


                )}

                <div className="pagination">
                    <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            className={currentPage === i + 1 ? "active" : ""}
                            onClick={() => setCurrentPage(i + 1)}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={
                            currentPage === totalPages || totalPages === 0
                        }
                    >
                        Next
                    </button>
                </div>
            </div>

            {/* =========================
                REPLY MODAL
            ========================= */}
            {replyingId && (() => {
                const selectedContact = contacts.find(
                    (item) => item._id === replyingId
                );

                if (!selectedContact) return null;

                return (
                    <div
                        className="contact-modal-overlay"
                        onClick={handleCancelReply}
                    >
                        <div
                            className="contact-modal"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="contact-modal-header">
                                <div>
                                    <h2>
                                        {selectedContact.adminReply
                                            ? "View Reply"
                                            : "Reply to Customer"}
                                    </h2>

                                    <p>
                                        {selectedContact.name} ·{" "}
                                        {selectedContact.email}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="contact-modal-close"
                                    onClick={handleCancelReply}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="contact-modal-section">
                                <label>Customer Message</label>

                                <div className="contact-modal-message-box">
                                    {selectedContact.comment}
                                </div>
                            </div>

                            {selectedContact.adminReply && (
                                <div className="contact-modal-section">
                                    <label>Previous Admin Reply</label>

                                    <div className="contact-modal-message-box previous">
                                        {selectedContact.adminReply}
                                    </div>

                                    {selectedContact.repliedAt && (
                                        <small className="contact-replied-date">
                                            Replied on{" "}
                                            {formatDate(
                                                selectedContact.repliedAt
                                            )}
                                        </small>
                                    )}
                                </div>
                            )}

                            <div className="contact-modal-section">
                                <label>
                                    {selectedContact.adminReply
                                        ? "Update Reply"
                                        : "Your Reply"}
                                </label>

                                <textarea
                                    className="contact-modal-textarea"
                                    rows="5"
                                    placeholder="Type your reply to the customer..."
                                    value={replyText}
                                    onChange={(e) =>
                                        setReplyText(e.target.value)
                                    }
                                />
                            </div>

                            <div className="contact-modal-actions">
                                <button
                                    type="button"
                                    className="contact-modal-cancel"
                                    onClick={handleCancelReply}
                                    disabled={sendingReply}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="button"
                                    className="contact-modal-send"
                                    onClick={() =>
                                        handleSendReply(
                                            selectedContact._id
                                        )
                                    }
                                    disabled={sendingReply}
                                >
                                    {sendingReply
                                        ? "Sending..."
                                        : selectedContact.adminReply
                                            ? "Update Reply"
                                            : "Send Reply"}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}