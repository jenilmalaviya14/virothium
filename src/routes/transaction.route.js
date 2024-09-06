const express = require('express');
const router = express.Router();
const transactionDetailsController = require("../controller/transaction-details.controller");

router.post(
    "/transaction/transaction-hash",
    transactionDetailsController.saveTransactionHashInQueue
);

router.post(
    "/transaction/transaction-hash-test",
    transactionDetailsController.transactionHashTest
);

module.exports = router;