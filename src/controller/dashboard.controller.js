const tokenDbService = require("../services/database-services/token-db.service");
const pairDbService = require("../services/database-services/pair-db.service");
const { getNativeTokenInfo, getOverviewTokenInfo, getDashboarChartData } = require("../services/database-services/dashboard-db.service");
const utilityService = require("../services/common-services/utility-common.service");
const { logError } = require('../services/common-services/log-common.service')

const findNativeTokenDetailsInfo = async (req, res) => {
    try {
        const nativeTokenAddress = process.env.NATIVE_TOKEN_ADDRESS;
        await utilityService.getNativeTokenUSDRate()
        const nativeTokenData = await getNativeTokenInfo(nativeTokenAddress);

        res.status(200).json({
            success: true,
            message: "Native Token details fetched successfully",
            data: nativeTokenData
        });
    } catch (error) {
        logError("Error in findNativeTokenDetailsInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findOverviewTokenDetailsInfo = async (req, res) => {
    try {
        await utilityService.getNativeTokenUSDRate()
        const nativeTokenData = await getOverviewTokenInfo();

        res.status(200).json({
            success: true,
            message: "Token details fetched successfully",
            data: nativeTokenData
        });
    } catch (error) {
        logError("Error in findOverviewTokenDetailsInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findTokenDetialsInDashboardInfo = async (req, res) => {
    try {
        const tokenDetails = await tokenDbService.findAllTokenDetails();
        if (tokenDetails.length > 0) {

            const tokenDetailsWithIcon = tokenDetails.map(token => {
                const tokenWithIcon = { ...token };

                if (token.tokenIcon) {
                    tokenWithIcon.tokenIcon = `${req.baseURL}${token.tokenIcon}`;
                }

                return tokenWithIcon;
            });

            res.status(200).json({
                success: true,
                message: "Token list has been fetched Successfully.",
                data: tokenDetailsWithIcon
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No tokens found for the token.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findTokenDetialsInDashboardInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findPairDetailsInDashboardInfo = async (req, res) => {
    try {
        const pairDetails = await pairDbService.findAllPairDetails();
        if (pairDetails.length > 0) {
            const pairDetailsWithIcon = pairDetails.map(pair => {
                const pairWithIcon = { ...pair };

                if (pair.tokenIcon0) {
                    pairWithIcon.tokenIcon0 = `${req.baseURL}${pair.tokenIcon0}`;
                }

                if (pair.tokenIcon1) {
                    pairWithIcon.tokenIcon1 = `${req.baseURL}${pair.tokenIcon1}`;
                }

                return pairWithIcon;
            });
            res.status(200).json({
                success: true,
                message: "Pair list has been fetched Successfully.",
                data: pairDetailsWithIcon
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No pairs found for the token.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findPairDetailsInDashboardInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findNativetokenTransactionsInDashboardInfo = async (req, res) => {
    try {
        const nativeTokenAddress = process.env.NATIVE_TOKEN_ADDRESS;
        const actionType = req.body.actionType;
        let transactions;
        if (actionType) {
            transactions = await tokenDbService.findTransactionsByTokenAddress(actionType, '', nativeTokenAddress, '');
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid actionType provided."
            });
        };
        if (transactions && transactions.length > 0) {
            res.status(200).json({
                success: true,
                message: "transaction details fetched successfully",
                data: transactions
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No transactions found for the native token address.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findNativetokenTransactionsInDashboardInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findTransactionsInDashboardInfo = async (req, res) => {
    try {
        const actionType = req.body.actionType;
        let transactions;
        if (actionType) {
            transactions = await tokenDbService.findTransactionsByTokenAddress(actionType, '', '', '');
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid actionType provided."
            });
        };
        if (transactions && transactions.length > 0) {
            res.status(200).json({
                success: true,
                message: "transaction details fetched successfully",
                data: transactions
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No transactions found for the native token address.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findTransactionsInDashboardInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findDashboardChartDataInfo = async (req, res) => {
    try {
        const periodTime = 1
        const periodType = 'year'
        const transactions = await getDashboarChartData(periodType, periodTime);
        if (transactions.length > 0) {
            res.status(200).json({
                success: true,
                message: "Overview Chart Data fetched successfully",
                data: transactions
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No Chart Data found for the nativetoken.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findDashboardChartDataInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findDashboardNativetokenChartDataInfo = async (req, res) => {
    try {
        const nativeTokenAddress = process.env.NATIVE_TOKEN_ADDRESS;
        const periodTime = 1
        const periodType = 'year'
        const transactions = await tokenDbService.findChartsByTokenAddress(nativeTokenAddress, periodType, periodTime);
        if (transactions.length > 0) {
            res.status(200).json({
                success: true,
                message: "Overview Chart Data fetched successfully",
                data: transactions
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No Chart Data found for the nativetoken.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findDashboardNativetokenChartDataInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getNativeTokenPriceInfo = async (req, res) => {
    try {
        const price = await utilityService.getNativeTokenUSDRate(false);
        if (price !== null) {
            res.status(200).json({
                success: true,
                message: "Price fetched successfully",
                data: { price }
            });
        } else {
            res.status(200).json({
                success: false,
                message: "No price found.",
                data: {}
            });
        }
    } catch (error) {
        logError("Error in getNativeTokenPriceInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const searchTokenAndPairDetails = async (req, res) => {
    try {
        const { q } = req.query;

        // if (!q) {
        //     return res.status(400).json({
        //         success: false,
        //         message: "Missing required parameters. Please provide address or name."
        //     });
        // }

        pairData = await pairDbService.searchPairDetails(q);
        tokenData = await tokenDbService.searchTokenDetails(q);

        const pairDataWithIcon = pairData.map(pair => {
            const pairWithIcon = { ...pair };

            if (pair.tokenIcon0) {
                pairWithIcon.tokenIcon0 = `${req.baseURL}${pair.tokenIcon0}`;
            }
            if (pair.tokenIcon1) {
                pairWithIcon.tokenIcon1 = `${req.baseURL}${pair.tokenIcon1}`;
            }
            return pairWithIcon;
        });

        const tokenDataWithIcon = tokenData.map(token => {
            const tokenWithIcon = { ...token };

            if (token.tokenIcon) {
                tokenWithIcon.tokenIcon = `${req.baseURL}${token.tokenIcon}`;
            }

            return tokenWithIcon;
        });

        res.status(200).json({
            success: true,
            message: "Search results found successfully.",
            pairData: pairDataWithIcon,
            tokenData: tokenDataWithIcon
        });

    } catch (error) {
        logError("Error in searchTokenAndPairDetails() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    findNativeTokenDetailsInfo,
    findOverviewTokenDetailsInfo,
    findTokenDetialsInDashboardInfo,
    findPairDetailsInDashboardInfo,
    findTransactionsInDashboardInfo,
    findNativetokenTransactionsInDashboardInfo,
    findDashboardChartDataInfo,
    findDashboardNativetokenChartDataInfo,
    getNativeTokenPriceInfo,
    searchTokenAndPairDetails
};