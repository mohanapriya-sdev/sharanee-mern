const Contact = require("../models/Contact");
// ======================================================
// @desc    Create new contact message
// @route   POST /api/contacts
// @access  Public / Logged-in Customer
// ======================================================
const createContact = async (req, res) => {
    try {
        const { name, phone, email, subject, comment } = req.body;

        // Validate required fields
        if (!name || !phone || !email || !subject || !comment) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields",
            });
        }

        // Create contact message
        const contact = await Contact.create({
            // Logged-in customer ID, otherwise null for guest
            user: req.user ? req.user._id : null,

            name,
            phone,
            email,
            subject,
            comment,
        });

        res.status(201).json({
            success: true,
            message: "Your message has been sent successfully",
            contact,
        });
    } catch (error) {
        console.error("Create Contact Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to send message",
        });
    }
};


// ======================================================
// @desc    Get logged-in customer's contact messages
// @route   GET /api/contacts/my
// @access  Customer
// ======================================================
const getMyContacts = async (req, res) => {
    try {
        const contacts = await Contact.find({
            user: req.user._id,
        }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: contacts.length,
            contacts,
        });
    } catch (error) {
        console.error("Get My Contacts Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch your messages",
        });
    }
};


// ======================================================
// @desc    Get all contact messages
// @route   GET /api/contacts
// @access  Admin
// ======================================================
const getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: contacts.length,
            contacts,
        });
    } catch (error) {
        console.error("Get Contacts Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch contact messages",
        });
    }
};

// ======================================================
// @desc    Update contact message status
// @route   PUT /api/contacts/:id/status
// @access  Admin
// ======================================================
const updateContactStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = ["New", "Read", "Replied"];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid contact status",
            });
        }

        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found",
            });
        }

        contact.status = status;

        await contact.save();

        res.status(200).json({
            success: true,
            message: "Contact status updated successfully",
            contact,
        });
    } catch (error) {
        console.error("Update Contact Status Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update contact status",
        });
    }
};


// ======================================================
// @desc    Reply to contact message
// @route   PUT /api/contacts/:id/reply
// @access  Admin
// ======================================================
const replyToContact = async (req, res) => {
    try {
        const { reply } = req.body;

        // Validate reply
        if (!reply || !reply.trim()) {
            return res.status(400).json({
                success: false,
                message: "Reply message is required",
            });
        }

        // Find contact message
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found",
            });
        }

        // Save actual admin reply
        contact.adminReply = reply.trim();

        // Automatically mark as Replied
        contact.status = "Replied";

        // Save reply date/time
        contact.repliedAt = new Date();

        await contact.save();

        res.status(200).json({
            success: true,
            message: "Reply sent successfully",
            contact,
        });
    } catch (error) {
        console.error("Reply Contact Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to send reply",
        });
    }
};

// ======================================================
// @desc    Delete contact message
// @route   DELETE /api/contacts/:id
// @access  Admin
// ======================================================
const deleteContact = async (req, res) => {
    try {
        const contact = await Contact.findById(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: "Contact message not found",
            });
        }

        await contact.deleteOne();

        res.status(200).json({
            success: true,
            message: "Contact message deleted successfully",
        });
    } catch (error) {
        console.error("Delete Contact Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete contact message",
        });
    }
};

module.exports = {
    createContact,
    getMyContacts,
    getContacts,
    updateContactStatus,
    replyToContact,
    deleteContact,
};