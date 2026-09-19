const express = require("express");
const router = express.Router();
const { createOrder, addStatus, getOrder } = require("../controllers/orders");
const authenticateToken = require("../middleware/auth");

router.post("/", authenticateToken, createOrder);
router.post("/:trackingId/status", authenticateToken, addStatus);
router.get("/:trackingId",  getOrder);

module.exports = router;