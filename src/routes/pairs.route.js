const express = require('express');
const router = express.Router();
const pairController = require("../controller/pair.controller");

router.get(
    "/pair/pair-list",
    pairController.findAllPairDetailsInfo
);

router.get(
    "/pair/pair-details/:pairAddress",
    pairController.findByPairAddressFromPairDetails
);

router.post(
    "/pair/pair-transactions/:pairAddress",
    pairController.findTransactionsByPairAddressInfo
);

router.post(
    "/pair/pair-chart/:pairAddress",
    pairController.findChartByPairAddressInfo
);

router.post(
    "/pair/pair-hourly-chart/:pairAddress",
    pairController.findPairHourlyChartByPairAddressInfo
);

router.post(
    "/pair/save-pairs",
    pairController.savePairDataFromPairAddress
);

router.post(
    "/pair/lp-price",
    pairController.getLPPriceFromPairAddress
);

module.exports = router;