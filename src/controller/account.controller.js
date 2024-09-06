const accountDbService = require("../services/database-services/account-db.service");
const { logError, logDebug } = require("../services/common-services/log-common.service");

const findAllAccountDetailsInfo = async (req, res) => {
    try {
        const accountDetails = await accountDbService.findAllAccountDetails();
        if (accountDetails.length > 0) {
            const accountDetailsWithIcon = accountDetails.map(account => {
                const accountWithIcon = { ...account };

                if (account.tokenIcon0) {
                    accountWithIcon.tokenIcon0 = `${req.baseURL}${account.tokenIcon0}`;
                }

                if (account.tokenIcon1) {
                    accountWithIcon.tokenIcon1 = `${req.baseURL}${account.tokenIcon1}`;
                }

                return accountWithIcon;
            });
            res.status(200).json({
                success: true,
                message: "Accounts list has been fetched Successfully.",
                data: accountDetailsWithIcon
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No Accounts found for the token.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findAllAccountDetailsInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findByAccountAddressFromAccountDetailsInfo = async (req, res) => {
    try {
        const accountAddress = req.params.accountAddress;
        const pairAddress = req.body.pairAddress ?? '';
        if (!accountAddress) {
            return res.status(400).json({
                success: false,
                message: "Receiver address is required."
            });
        }
        const accountDetails = await accountDbService.getAccountDetailsByAccountAddress(accountAddress, pairAddress);
        if (accountDetails) {
            const accountDetailsWithIcon = accountDetails.map(account => {
                const accountWithIcon = { ...account };

                if (account.tokenIcon0) {
                    accountWithIcon.tokenIcon0 = `${req.baseURL}${account.tokenIcon0}`;
                }

                if (account.tokenIcon1) {
                    accountWithIcon.tokenIcon1 = `${req.baseURL}${account.tokenIcon1}`;
                }

                return accountWithIcon;
            });
            res.status(200).json({
                success: true,
                message: "Accounts list has been fetched Successfully.",
                data: accountDetailsWithIcon
            });
        } else {
            res.status(200).json({
                success: false,
                message: "No Accounts found for the token.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findByAccountAddressFromAccountDetailsInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findByPositionListFromAccountDetailsInfo = async (req, res) => {
    try {
        const accountAddress = req.params.accountAddress ?? '';
        const pairAddress = req.body.pairAddress ?? ''
        const accountDetails = await accountDbService.getAccountDetailsByPositionList(accountAddress, pairAddress);
        if (accountDetails) {
            const accountDetailsWithIcon = accountDetails.map(account => {
                const accountWithIcon = { ...account };

                if (account.tokenIcon0) {
                    accountWithIcon.tokenIcon0 = `${req.baseURL}${account.tokenIcon0}`;
                }

                if (account.tokenIcon1) {
                    accountWithIcon.tokenIcon1 = `${req.baseURL}${account.tokenIcon1}`;
                }

                return accountWithIcon;
            });
            res.status(200).json({
                success: true,
                message: "pair Accounts has been fetched Successfully.",
                data: accountDetailsWithIcon
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No Accounts found for the token.",
                data: [],
            });
        }
    } catch (error) {
        logError("Error in findByPositionListFromAccountDetailsInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findByAllPositionListFromAccountDetailsInfo = async (req, res) => {
    try {
        const accountAddress = req.params.accountAddress ?? '';
        const pairAddress = ''
        const accountDetails = await accountDbService.getAccountDetailsByAllPositionList(accountAddress, pairAddress);
        if (accountDetails) {
            res.status(200).json({
                success: true,
                message: "Position has been fetched Successfully.",
                data: accountDetails
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No Accounts found for the token.",
                data: {}
            });
        }
    } catch (error) {
        logError("Error in findByPositionListFromAccountDetailsInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findBySwapAndTransactionsDataInfo = async (req, res) => {
    try {
        const accountAddress = req.params.accountAddress ?? '';
        const accountDetails = await accountDbService.getAccountSwapAndTransactionData(accountAddress);
        if (accountDetails) {
            res.status(200).json({
                success: true,
                message: "Transaction And Swap data has been fetched Successfully.",
                data: accountDetails
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No Transaction And Swap data found for the token.",
                data: {}
            });
        }
    } catch (error) {
        logError("Error in findBySwapAndTransactionsDataInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findChartByAccountAddressInfo = async (req, res) => {
    try {
        const periodTime = 1
        const accountAddress = req.params.accountAddress ?? '';
        const pairAddress = req.body.pairAddress ?? '';
        const periodType = req.body.periodType
        const accountChartDetails = await accountDbService.findAccountChartsByAccountAddress(accountAddress, pairAddress, periodType, periodTime);
        if (accountChartDetails) {
            res.status(200).json({
                success: true,
                message: "Account Chart Data fetched successfully",
                data: accountChartDetails
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No Chart Data found for the pairAddress.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findChartByAccountAddressInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findTransactionsByAccountAddressInfo = async (req, res) => {
    const actionType = req.body.actionType ?? '';
    const pairAddress = '';
    const tokenAddress = '';
    const accountAddress = req.params.accountAddress;
    try {
        let transactions;
        if (actionType) {
            transactions = await accountDbService.findTransactionsByAccountAddress(actionType, pairAddress, tokenAddress, accountAddress);
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
                message: "No transactions found for the Pair address.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findTransactionsByAccountAddressInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    findAllAccountDetailsInfo,
    findByAccountAddressFromAccountDetailsInfo,
    findByPositionListFromAccountDetailsInfo,
    findByAllPositionListFromAccountDetailsInfo,
    findBySwapAndTransactionsDataInfo,
    findChartByAccountAddressInfo,
    findTransactionsByAccountAddressInfo
}