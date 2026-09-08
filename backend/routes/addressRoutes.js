const express = require("express");
const router = express.Router();
const {
    addAddress,
    getAddresses,
    updateAddress,
    removeAddress,
    verifyPincode,
} = require("../controllers/addressController");
const { protect } = require("../middleware/auth");

router.post("/", addAddress);
router.get("/verify-pincode/:pincode", verifyPincode);
router.get("/:userId", protect, getAddresses);
router.put("/:id", protect, updateAddress);

router.delete("/:id", protect, removeAddress);

module.exports = router;
