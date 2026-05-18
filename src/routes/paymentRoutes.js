const express = require("express");
const router = express.Router();

const { processPayment } = require("../services/idempotencyService");

router.post("/process-payment", processPayment);

module.exports = router;