const express = require('express');
const router = express.Router();
const { upload } = require("../middlewares/upload");
const tokenController = require("../controller/token.controller");

router.get(
    "/token/token-list",
    tokenController.findAllTokenDetailsInfo
);

router.get(
    "/token/token-details/:tokenAddress",
    tokenController.findByTokenAddressFromTokenDetailsInfo
);

router.get(
    "/token/token-pairs/:tokenAddress",
    tokenController.findPairsByTokenAddressInfo
);

router.post(
    "/token/token-transactions/:tokenAddress",
    tokenController.findTransactionsByTokenAddressInfo
);

router.post(
    "/token/token-chart/:tokenAddress",
    tokenController.findChartByTokenAddressInfo
);

router.post(
    "/token/token-hourly-chart/:tokenAddress",
    tokenController.findTokenHourlyChartByTokenAddressInfo
);

router.post(
    "/token/token-daily-chart/:tokenAddress",
    tokenController.findTokenDailyChartByTokenAddressInfo
);

router.post(
    '/token/token-icon/:tokenAddress',
    upload.single('tokenIcon'),
    tokenController.saveTokenIconByTokenAddress
);

module.exports = router;