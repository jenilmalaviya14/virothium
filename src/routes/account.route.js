const express = require('express');
const router = express.Router();
const accountController = require("../controller/account.controller");

router.get(
    "/account/account-list",
    accountController.findAllAccountDetailsInfo
);

router.post(
    "/account/account-details/:accountAddress",
    accountController.findByAccountAddressFromAccountDetailsInfo
);

router.post(
    "/account/position-list/:accountAddress",
    accountController.findByPositionListFromAccountDetailsInfo
);

router.get(
    "/account/all-position-list/:accountAddress",
    accountController.findByAllPositionListFromAccountDetailsInfo
);

router.post(
    "/account/account-chart/:accountAddress",
    accountController.findChartByAccountAddressInfo
);

router.post(
    "/account/account-transaction/:accountAddress",
    accountController.findTransactionsByAccountAddressInfo
);

router.get(
    "/account/account-swap-transaction/:accountAddress",
    accountController.findChartByAccountAddressInfo
);


module.exports = router;