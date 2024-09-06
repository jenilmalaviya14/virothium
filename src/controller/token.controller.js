const tokenDbService = require("../services/database-services/token-db.service");
const { updateTokenIcon } = require('../services/database-services/token-db.service');
const { logError, logDebug } = require('../services/common-services/log-common.service');

const saveUSDCToken = async (tokenAddress) => {
    try {
        await tokenDbService.saveTokenAddress(tokenAddress);
        return { success: true, message: "Token details saved successfully." };
    } catch (error) {
        logError("Error saving token details:", error);
        return { success: false, message: "Failed to save token details." };
    }
};

const findAllTokenDetailsInfo = async (req, res) => {
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
                message: "Token list has been fetched successfully.",
                data: tokenDetailsWithIcon
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No tokens found.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findAllTokenDetailsInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findByTokenAddressFromTokenDetailsInfo = async (req, res) => {
    const tokenAddress = req.params.tokenAddress
    try {
        const tokenDetails = await tokenDbService.getTokenDetailsByTokenAddress(tokenAddress);
        if (tokenDetails) {
            tokenDetails.later24hoursTransactions = Number(tokenDetails.later24hoursTransactions);
            tokenDetails.last24hoursTransactions = Number(tokenDetails.last24hoursTransactions);
            tokenDetails.change24hoursTransactionsPercentage = Number(tokenDetails.change24hoursTransactionsPercentage);

            if (tokenDetails.tokenIcon) {
                tokenDetails.tokenIcon = `${req.baseURL}${tokenDetails.tokenIcon}`;
            }

            res.status(200).json({
                success: true,
                message: "Token list has been fetched Successfully.",
                data: tokenDetails
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No tokens found for the token.",
                data: {}
            });
        }
    } catch (error) {
        logError("Error in findByTokenAddressFromTokenDetailsInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findPairsByTokenAddressInfo = async (req, res) => {
    const pairAddress = req.params.pairAddress ?? '';
    const tokenAddress = req.params.tokenAddress;
    try {
        const tokenDetails = await tokenDbService.findPairsByTokenAddress(pairAddress, tokenAddress);
        if (tokenDetails) {
            const tokenDetailsWithIcon = tokenDetails.map(token => {
                const tokenWithIcon = { ...token };

                if (token.tokenIcon0) {
                    tokenWithIcon.tokenIcon0 = `${req.baseURL}${token.tokenIcon0}`;
                }

                if (token.tokenIcon1) {
                    tokenWithIcon.tokenIcon1 = `${req.baseURL}${token.tokenIcon1}`;
                }

                return tokenWithIcon;
            });
            res.status(200).json({
                success: true,
                message: "Fetched Successfully within the Pairs token.",
                data: tokenDetailsWithIcon
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No pairs found for the token.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findByTokenAddressFromTokenDetailsInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findTransactionsByTokenAddressInfo = async (req, res) => {
    const actionType = req.body.actionType ?? '';
    const pairAddress = '';
    const accountAddress = '';
    const tokenAddress = req.params.tokenAddress;
    try {
        if (!actionType) {
            return res.status(400).json({
                success: false,
                message: "Invalid actionType provided."
            });
        }
        const transactions = await tokenDbService.findTransactionsByTokenAddress(actionType, pairAddress, tokenAddress, accountAddress);

        if (transactions.length > 0) {
            res.status(200).json({
                success: true,
                message: "Transaction details fetched successfully",
                data: transactions
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No transactions found for the token address and action type.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findTransactionsByTokenAddressInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findChartByTokenAddressInfo = async (req, res) => {
    try {
        const periodTime = 1
        const tokenAddress = req.params.tokenAddress ?? '';
        const periodType = req.body.periodType ?? ''
        const tokenChartData = await tokenDbService.findChartsByTokenAddress(tokenAddress, periodType, periodTime);
        if (tokenChartData.length > 0) {
            res.status(200).json({
                success: true,
                message: "Token Chart Data fetched successfully",
                data: tokenChartData
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No Chart Data found for the tokenAddress.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findChartByTokenAddressInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findTokenHourlyChartByTokenAddressInfo = async (req, res) => {
    try {
        const periodTime = 1
        const tokenAddress = req.params.tokenAddress ?? '';
        const periodType = req.body.periodType ?? 'week';
        const tokenHourlyChartData = await tokenDbService.findTokenHourlyChartByTokenAddress(tokenAddress, periodType, periodTime);
        if (tokenHourlyChartData.length > 0) {
            res.status(200).json({
                success: true,
                message: "Token Hourly Chart Data fetched successfully",
                data: tokenHourlyChartData
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No Token Hourly Chart Data found for the tokenAddress.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findTokenHourlyChartByTokenAddressInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findTokenDailyChartByTokenAddressInfo = async (req, res) => {
    try {
        const periodTime = 1
        const tokenAddress = req.params.tokenAddress ?? '';
        const periodType = req.body.periodType
        const tokenDailyChartData = await tokenDbService.findTokenDailyChartByTokenAddress(tokenAddress, periodType, periodTime);
        if (tokenDailyChartData.length > 0) {
            res.status(200).json({
                success: true,
                message: "Token Daily Chart Data fetched successfully",
                data: tokenDailyChartData
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No Token Daily Chart Data found for the tokenAddress.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findTokenDailyChartByTokenAddressInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const saveTokenIconByTokenAddress = async (req, res) => {
    try {
        const tokenAddress = req.params.tokenAddress;
        const privateKey = req.headers['privatekey'];

        logDebug("saveTokenIconByTokenAddress privateKey", privateKey || "Private key not received");
        logDebug("saveTokenIconByTokenAddress process.env.PRIVATE_KEY", process.env.PRIVATE_KEY);

        if (privateKey !== process.env.PRIVATE_KEY) {
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid private key" });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Token icon file not provided" });
        }

        const tokenIconPath = `images/token-icons/${req.file.filename}`;

        await updateTokenIcon(tokenAddress, tokenIconPath);

        const tokenIconUrl = `${req.baseURL}${tokenIconPath}`;

        return res.status(200).json({ success: true, message: "Token icon uploaded successfully", tokenIconUrl });
    } catch (error) {
        logError("Error in saveTokenIconByTokenAddress() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// saveUSDCToken();

module.exports = {
    findAllTokenDetailsInfo,
    findByTokenAddressFromTokenDetailsInfo,
    findPairsByTokenAddressInfo,
    findTransactionsByTokenAddressInfo,
    findChartByTokenAddressInfo,
    findTokenHourlyChartByTokenAddressInfo,
    findTokenDailyChartByTokenAddressInfo,
    saveTokenIconByTokenAddress
}