const { executeQuery } = require('../../db/db-query');
const { logError, logDebug } = require('../common-services/log-common.service');

const insertAccountInfo = async (accountData) => {
    try {
        const { accountAddress, pairAddress, actionType } = accountData;

        if (actionType.toLowerCase() === 'mint' || actionType.toLowerCase() === 'burn') {
            const sql = `
            INSERT INTO account_master
            (accountAddress, pairAddress, createdOn, updatedOn)
            VALUES
            ('${accountAddress}', '${pairAddress}', UTC_TIMESTAMP(), UTC_TIMESTAMP())
          `;
            await executeQuery(sql);
            logDebug("Account saved to database");
        }
        return true;
    } catch (error) {
        logError("Error in insertAccountInfo() function:", error);
        return false;
    }
};

const saveOrUpdateAccountInfo = async (accountData) => {
    try {
        const { accountAddress, pairAddress } = accountData;

        const existingAccount = await checkAccountExists(accountAddress, pairAddress);
        if (!existingAccount) {
            const insertResult = await insertAccountInfo(accountData);
            if (!insertResult) {
                return false;
            }
        }
        const updateResult = await updateAccountInfo(accountData);
        return updateResult;
    } catch (error) {
        logError("Error in saveOrUpdateAccountInfo() function:", error);
        return false;
    }
};

const checkAccountExists = async (accountAddress, pairAddress) => {
    try {
        const sql = `
            SELECT accountAddress, pairAddress
            FROM account_master
            WHERE accountAddress = '${accountAddress}' AND pairAddress = '${pairAddress}'
        `;
        const results = await executeQuery(sql);
        if (results) {
            const [existingAccount] = results;
            return existingAccount.length > 0;
        }
        return 0;
    } catch (error) {
        logError("Error in checkAccountExists() function:", error);
        return false;
    }
};

const fetchPairData = async (pairAddress) => {
    try {
        const sql = `
            SELECT volumeToken0, volumeToken1, volumeUSD
            FROM pair_master
            WHERE pairAddress = '${pairAddress}'
        `;
        const results = await executeQuery(sql);
        if (results) {
            const [[pairData]] = results;
            return pairData;
        }
        return null;
    } catch (error) {
        logError("Error in fetchPairData() function:", error);
        throw error;
    }
};

const updateAccountInfo = async (accountData) => {
    try {
        logDebug("accountData", accountData);
        const { accountAddress, pairAddress, accountliquidityToken0, accountliquidityToken1, accountliquidityUSD, priceUSDToken0, priceUSDToken1, totalSupplyDecimal, balanceOfDecimal, accountconversationRatio, accountVolumeToken0, accountVolumeToken1, accountVolumeUSD, actionType } = accountData

        if (actionType.toLowerCase() === 'mint' || actionType.toLowerCase() === 'burn') {

            let sql = `
            UPDATE account_master
            SET
                liquidityToken0 = ${accountliquidityToken0},
                liquidityToken1 = ${accountliquidityToken1},
                liquidityUSD = ${accountliquidityUSD},
                priceUSD0 = ${priceUSDToken0},
                priceUSD1 = ${priceUSDToken1},
                totalSupply = ${totalSupplyDecimal},
                balanceOf = ${balanceOfDecimal},
                conversationRatio = ${accountconversationRatio},
                volumeToken0 = ${accountVolumeToken0},
                volumeToken1 = ${accountVolumeToken1},
                volumeUSD = ${accountVolumeUSD},
                updatedOn = UTC_TIMESTAMP()
            WHERE accountAddress = '${accountAddress}' AND pairAddress = '${pairAddress}'
        `;
            await executeQuery(sql);
        } else if (actionType.toLowerCase() === 'swap') {
            let sql = `
            UPDATE account_master
            SET
                totalSupply = ${totalSupplyDecimal},
                balanceOf = ${balanceOfDecimal},
                conversationRatio = ${accountconversationRatio},
                volumeToken0 = ${accountVolumeToken0},
                volumeToken1 = ${accountVolumeToken1},
                volumeUSD = ${accountVolumeUSD},
                updatedOn = UTC_TIMESTAMP()
            WHERE accountAddress = '${accountAddress}' AND pairAddress = '${pairAddress}'
        `;
            await executeQuery(sql);
        }
        return true;
    } catch (error) {
        logError("Error in updateAccountInfo() function:", error);
        return false;
    }
};

const findAllAccountDetails = async () => {
    try {
        let sql;
        sql = `CALL report_list_accounts_analytics(${null})`;
        const results = await executeQuery(sql);
        if (results) {
            const [[accountDetails]] = results;
            return accountDetails;
        }
        return null;
    } catch (error) {
        logError('Error in findAllAccountDetails() function:', error);
        throw error;
    }
};

const getAccountDetailsByAccountAddress = async (accountAddress, pairAddress) => {
    try {
        let sql;
        sql = `CALL report_account_analytics('${accountAddress}', '${pairAddress}')`;
        const results = await executeQuery(sql);
        if (results) {
            const [[accountDetails]] = results;
            return accountDetails;
        }
        return null;
    } catch (error) {
        logError('Error in getAccountDetailsByAccountAddress() function:', error);
    }
};

const getAccountDetailsByPositionList = async (accountAddress, pairAddress) => {
    try {
        let sql;
        sql = `CALL report_position_list('${accountAddress}', '${pairAddress}')`;
        const results = await executeQuery(sql);
        if (results) {
            const [[accountDetails]] = results;
            return accountDetails;
        }
        return null;
    } catch (error) {
        logError('Error in getAccountDetailsByPositionList() function:', error);
    }
};

const getAccountDetailsByAllPositionList = async (accountAddress) => {
    try {
        let sql;
        sql = `CALL report_all_position_list('${accountAddress}')`;
        const results = await executeQuery(sql);
        if (results) {
            const [[[accountDetails]]] = results;
            return accountDetails;
        }
        return null;
    } catch (error) {
        logError('Error in getAccountDetailsByAllPositionList() function:', error);
    }
};

const getAccountSwapAndTransactionData = async (accountAddress) => {
    try {
        let sql;
        sql = `CALL account_swap_transactions('${accountAddress}')`;
        const results = await executeQuery(sql);
        if (results) {
            const [[[accountDetails]]] = results;
            return accountDetails;
        }
        return null;
    } catch (error) {
        logError('Error in getAccountSwapAndTransactionData() function:', error);
    }
};

const findTransactionsByAccountAddress = async (actionType, pairAddress, tokenAddress, accountAddress) => {
    try {
        let sql;
        sql = `CALL report_list_transactions_analytics('${actionType}', '${pairAddress}', '${tokenAddress}', '${accountAddress}')`;
        const results = await executeQuery(sql);
        if (results) {
            const [[accountByTransactions]] = results;
            return accountByTransactions;
        }
        return null;
    } catch (error) {
        logError("Error fetching Transactions by account address:", error);
        throw error;
    }
};

const findAccountChartsByAccountAddress = async (accountAddress, pairAddress, periodType, periodTime) => {
    try {
        let sql;
        sql = `CALL account_chart('${accountAddress}', '${pairAddress}', '${periodType}', ${periodTime})`;
        const results = await executeQuery(sql);
        if (results) {
            const [[accountChartDetails]] = results;
            return accountChartDetails;
        }
        return null;
    } catch (error) {
        logError('Error in findAccountChartsByAccountAddress() function:', error);
        throw error;
    }
};

module.exports = {
    insertAccountInfo,
    saveOrUpdateAccountInfo,
    checkAccountExists,
    updateAccountInfo,
    fetchPairData,
    findAllAccountDetails,
    getAccountDetailsByAccountAddress,
    getAccountDetailsByPositionList,
    getAccountDetailsByAllPositionList,
    getAccountSwapAndTransactionData,
    findAccountChartsByAccountAddress,
    findTransactionsByAccountAddress
};
