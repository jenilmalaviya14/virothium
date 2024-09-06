const express = require('express');
const router = express.Router();
const dashboardController = require("../controller/dashboard.controller");

router.get(
    "/dashboard/dashboard-native-token",
    dashboardController.findNativeTokenDetailsInfo
);

router.get(
    "/dashboard/dashboard-platform-info",
    dashboardController.findOverviewTokenDetailsInfo
);

router.get(
    "/dashboard/dashboard-token",
    dashboardController.findTokenDetialsInDashboardInfo
);

router.get(
    "/dashboard/dashboard-pair",
    dashboardController.findPairDetailsInDashboardInfo
);

router.post(
    "/dashboard/dashboard-transactions",
    dashboardController.findTransactionsInDashboardInfo
);

router.post(
    "/dashboard/dashboard-native-token-transactions",
    dashboardController.findNativetokenTransactionsInDashboardInfo
);

router.get(
    "/dashboard/dashboard-chart",
    dashboardController.findDashboardChartDataInfo
);

router.get(
    "/dashboard/dashboard-native-token-chart",
    dashboardController.findDashboardNativetokenChartDataInfo
);

router.get(
    "/dashboard/search-pair-token",
    dashboardController.searchTokenAndPairDetails
);

router.get(
    "/dashboard/native-token-price",
    dashboardController.getNativeTokenPriceInfo
);

module.exports = router;