const express = require("express");
const router = express.Router();

const {
    createContact,
    getMyContacts,
    getContacts,
    updateContactStatus,
    replyToContact,
    deleteContact,
} = require("../controllers/contactController");

const {
    protect,
    optionalAuth,
    admin,
} = require("../middleware/auth");

// PUBLIC
// POST /api/contacts
router.post("/", optionalAuth, createContact);

// CUSTOMER - Get own contact messages and admin replies
// GET /api/contacts/my
router.get("/my", protect, getMyContacts);

router.put("/:id/status", protect, admin, updateContactStatus);

// ADMIN - Get all contact messages
// GET /api/contacts
router.get("/", protect, admin, getContacts);

// ADMIN - Update contact status
// PUT /api/contacts/:id/status


// ADMIN - Reply to contact message
// PUT /api/contacts/:id/reply
router.put("/:id/reply", protect, admin, replyToContact);

// ADMIN - Delete contact message
// DELETE /api/contacts/:id
router.delete("/:id", protect, admin, deleteContact);

module.exports = router;