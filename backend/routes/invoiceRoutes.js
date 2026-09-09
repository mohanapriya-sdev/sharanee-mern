const express = require("express");

const {
  downloadInvoice,
  downloadGuestInvoice,
} = require("../controllers/invoiceController");

const {
  protect,
} = require("../middleware/auth");

const router = express.Router();

// Customer/Admin
router.get("/:orderId", protect, downloadInvoice);

// Guest
router.post("/guest/:orderId", downloadGuestInvoice);

module.exports = router;