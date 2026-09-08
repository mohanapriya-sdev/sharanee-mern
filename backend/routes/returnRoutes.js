
const express = require("express");
const router = express.Router();

const {
    createReturn,
    createGuestReturn,
    myReturns,
    guestReturns,
    allReturns,
    updateReturnStatus,
} = require("../controllers/returnController");

const {
    protect,
    admin,
} = require("../middleware/auth");


// Customer - create return
router.post("/", protect, createReturn);

//guest return
router.post("/guest", createGuestReturn);


// Customer - get own returns
router.get("/my", protect, myReturns);


// Admin - get all returns
router.get("/", protect, admin, allReturns);


// Admin - update return/refund
router.put("/:id", protect, admin, updateReturnStatus);

router.post("/guest/my", guestReturns);


module.exports = router;