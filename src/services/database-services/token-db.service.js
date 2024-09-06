const { executeQuery } = require('../../db/db-query');
const { getTokenInfoFromContract } = require("../contract-services/erc20-contract.service");
const { logError, logDebug } = require('../common-services/log-common.service');
const { replaceUnwantedChar } = require('./utility.service');

const insertTokenInfo = async (tokenAddress) => {
    try {
        const { tokenName, tokenSymbol, tokenDecimals } = await getTokenInfoFromContract(tokenAddress)

        const sql = `INSERT INTO token_master (tokenAddress, tokenName, tokenSymbol, tokenDecimals,
             createdOn, updatedOn)
    VALUES ('${tokenAddress}', '${replaceUnwantedChar(tokenName)}', '${replaceUnwantedChar(tokenSymbol)}', ${tokenDecimals}, UTC_TIMESTAMP(), UTC_TIMESTAMP())`;
        await executeQuery(sql);
        logDebug("Token saved to database");
    } catch (error) {
        logError("Error inserting TokenCreated event data into database:", error);

    }
};

const saveTokenInfo = async (tokenAddress) => {
    try {
        let tokenExists = await checkTokenExists(tokenAddress);
        if (!tokenExists) {
            await insertTokenInfo(tokenAddress)
            tokenExists = await checkTokenExists(tokenAddress);
        }
        return tokenExists;
    } catch (error) {
        logError("Error saving token details to the database:", error);
    }
};

const checkTokenExists = async (tokenAddress) => {
    try {
        const sql = `SELECT * FROM token_master WHERE tokenAddress = '${tokenAddress}'`;
        const results = await executeQuery(sql);
        if (results) {
            const [[existingToken]] = results;
            logDebug(`existingToken: `, existingToken);
            return existingToken;
        }
        return null;
    } catch (error) {
        logError("Error checking if token exists in the database:", error);
    }
};

const updateTokenLiquidity = async (tokenAddress) => {
    try {
        let sql;
        sql = `CALL update_token_liquidity('${tokenAddress}')`;
        await executeQuery(sql);
        return true
    } catch (error) {
        logError('Error in updateTokenLiquidity() function:', error);
        return false;
    }
};

const updateTokenInfo = async (tokenData) => {
    try {
        const { tokenAddress, priceUSD, totalAmount, totalUSD, lastTransactionDateTime, lastBlockTimeStamp } = tokenData
        let sql = `
            UPDATE token_master
            SET totalTransactions = totalTransactions + 1,
                priceUSD = CASE WHEN (lastTransactionDateTime IS NULL OR lastTransactionDateTime <= '${lastTransactionDateTime}') THEN ${priceUSD ?? 0} ELSE priceUSD END,
        `;
        if (tokenData.actionType.toLowerCase() == 'swap') {
            sql += `
                tradeVolumeUSD = tradeVolumeUSD + ${totalUSD ?? 0},
                tradeVolume = tradeVolume + ${totalAmount ?? 0},
        `;
        }
        sql += `
                lastBlockTimeStamp = CASE WHEN (lastTransactionDateTime IS NULL OR lastTransactionDateTime <= '${lastTransactionDateTime}') THEN ${lastBlockTimeStamp} ELSE lastBlockTimeStamp END,
                lastTransactionDateTime = CASE WHEN (lastTransactionDateTime IS NULL OR lastTransactionDateTime <= '${lastTransactionDateTime}') THEN '${lastTransactionDateTime}' ELSE lastTransactionDateTime END,
                updatedOn = UTC_TIMESTAMP()
                WHERE tokenAddress = '${tokenAddress}'
        `;
        await executeQuery(sql);
        return true;
    } catch (error) {
        logError("Error updating token master for token:", error);
        return false;
    }
};

const findAllTokenDetails = async () => {
    try {
        let sql;
        sql = `CALL report_list_tokens_analytics(${null})`;
        const results = await executeQuery(sql);
        if (results) {
            const [[tokenDetails]] = results;
            return tokenDetails;
        }
        return null;
    } catch (error) {
        logError('Error in findAllTokenDetails() function:', error);
        throw error;
    }
};

const getTokenDetailsByTokenAddress = async (tokenAddress) => {
    try {
        let sql;
        sql = `CALL report_token_analytics('${tokenAddress}')`;
        const results = await executeQuery(sql);
        if (results) {
            const [[[tokenDetails]]] = results;
            return tokenDetails;
        }
        return null;
    } catch (error) {
        logError('Error in getTokenDetailsByTokenAddress() function:', error);
        throw error;
    }
};

const findPairsByTokenAddress = async (pairAddress, tokenAddress) => {
    try {
        let sql;
        sql = `CALL report_list_pairs_analytics('${pairAddress}', '${tokenAddress}')`;
        const results = await executeQuery(sql);
        if (results) {
            const [[pairDetails]] = results;
            return pairDetails;
        }
        return null;
    } catch (error) {
        logError('Error in findPairsByTokenAddress() function:', error);
        throw error;
    }
};

const findTransactionsByTokenAddress = async (actionType, pairAddress, tokenAddress, accountAddress) => {
    try {
        let sql;
        sql = `CALL report_list_transactions_analytics('${actionType}', '${pairAddress}', '${tokenAddress}', '${accountAddress}')`;
        const results = await executeQuery(sql);
        if (results) {
            const [[tokenByTransactions]] = results;
            return tokenByTransactions;
        }
        return null;
    } catch (error) {
        logError("Error in findTransactionsByTokenAddress() function:", error);
        throw error;
    }
};

const findChartsByTokenAddress = async (tokenAddress, periodType, periodTime) => {
    try {
        let sql;
        sql = `CALL token_chart('${tokenAddress}', '${periodType}', ${periodTime})`;
        const results = await executeQuery(sql);
        if (results) {
            const [[tokenChartDetails]] = results;
            return tokenChartDetails;
        }
        return null;
    } catch (error) {
        logError('Error in findChartsByTokenAddress() function:', error);
        throw error;
    }
};

const findTokenHourlyChartByTokenAddress = async (tokenAddress, periodType, periodTime) => {
    try {
        let sql;
        sql = `CALL token_hourly_candle_chart('${tokenAddress}', '${periodType}', ${periodTime})`;
        const results = await executeQuery(sql);
        if (results) {
            const [[tokenHourlyChartDetails]] = results;
            return tokenHourlyChartDetails;
        }
        return null;
    } catch (error) {
        logError('Error in findTokenHourlyChartByTokenAddress() function:', error);
        throw error;
    }
};

const findTokenDailyChartByTokenAddress = async (tokenAddress, periodType, periodTime) => {
    try {
        let sql;
        sql = `CALL token_daily_candle_chart('${tokenAddress}', '${periodType}', ${periodTime})`;
        const results = await executeQuery(sql);
        if (results) {
            const [[tokenDailyChartDetails]] = results;
            return tokenDailyChartDetails;
        }
        return null;
    } catch (error) {
        logError('Error in findTokenDailyChartByTokenAddress() function:', error);
        throw error;
    }
};

const searchTokenDetails = async (q) => {
    try {
        let sql = `SELECT tokenAddress AS address, tokenName AS name, tokenIcon FROM token_master WHERE (tokenAddress = '${q}' OR tokenName LIKE '%${q}%') OR ('${q}' = '' OR '${q}' IS NULL)`;
        const results = await executeQuery(sql);
        if (results) {
            const [tokenDetails] = results;
            return tokenDetails;
        }
        return null;
    } catch (error) {
        logError('Error in searchTokenDetails() function:', error);
        throw error;
    }
};

const updateTokenIcon = async (tokenAddress, tokenIconUrl) => {
    try {
        const sql = `UPDATE token_master SET tokenIcon = '${tokenIconUrl}' WHERE tokenAddress = '${tokenAddress}'`;
        await executeQuery(sql);
    } catch (error) {
        logError('Error in updateTokenIcon() function:', error);
    }
};

module.exports = {
    saveTokenInfo,
    findAllTokenDetails,
    getTokenDetailsByTokenAddress,
    findPairsByTokenAddress,
    findTransactionsByTokenAddress,
    findChartsByTokenAddress,
    findTokenHourlyChartByTokenAddress,
    findTokenDailyChartByTokenAddress,
    updateTokenLiquidity,
    updateTokenInfo,
    searchTokenDetails,
    updateTokenIcon
};