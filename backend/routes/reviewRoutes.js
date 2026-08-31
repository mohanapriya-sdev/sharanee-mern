const express = require("express");
const router = express.Router();

const {
    addReview,
    reviewsForProduct,
    updateReview,
    removeReview,
    canReview,
    getAllReviews,
    updateReviewStatus,
    getHomeReviews,
} = require("../controllers/reviewController");

const { protect, admin } = require("../middleware/auth");
const { reviewUpload } = require("../middleware/upload");


// ---------- Admin ----------
router.get("/", protect, admin, getAllReviews);

router.put("/:id/status", protect, admin, updateReviewStatus);

// ---------- Customer ----------
router.post(
    "/",
    protect,
    reviewUpload.array("images", 5),
    addReview
);

router.get("/home", getHomeReviews);

router.get("/can-review/:productId", protect, canReview);

router.get("/:productId", reviewsForProduct);

router.put(
    "/:id",
    protect,
    reviewUpload.array("images", 5),
    updateReview
);

router.delete("/:id", protect, removeReview);

module.exports = router;