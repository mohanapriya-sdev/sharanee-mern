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

router.post("/", protect, addAddress); 
router.get("/verify-pincode/:pincode", protect, verifyPincode);
router.get("/:userId", protect, getAddresses);
router.put("/:id", protect, updateAddress);

router.delete("/:id", protect, removeAddress);

module.exports = router;
