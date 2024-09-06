const { executeQuery } = require('../../db/db-query');
const lastSyncPairRank = require('./general-setting-db.service');
const { logError, logDebug } = require('../common-services/log-common.service');
const { replaceUnwantedChar } = require('./utility.service');

const insertPairInfo = async (pairData) => {
    try {
        logDebug(`insertPairInfo pairData: `, pairData);
        const { pairAddress, pairRank, tokenAddress0, tokenAddress1 } = pairData;
        const sql = `INSERT INTO pair_master (pairAddress, pairRank, tokenAddress0, tokenAddress1, createdOn, updatedOn)
    VALUES ('${pairAddress}', ${pairRank}, '${tokenAddress0}', '${tokenAddress1}', UTC_TIMESTAMP(), UTC_TIMESTAMP())`;
        await executeQuery(sql);
        logDebug("Pair saved to database");
    } catch (error) {
        logError("Error in insertPairInfo() function:", error);
    }
};

const savePairInfo = async (pairData) => {
    try {
        let pairExists = await checkPairExists(pairData.pairAddress);
        if (!pairExists) {
            await insertPairInfo(pairData);
            pairExists = await checkPairExists(pairData.pairAddress);
        };
        // await lastSyncPairRank.updateLastSyncPairRank(pairData.pairRank);
        return pairExists;
    } catch (error) {
        logError("Error in savePairInfo() function:", error);
    }
};

const checkPairExists = async (pairAddress) => {
    try {
        const sql = `SELECT * FROM pair_master WHERE pairAddress = '${pairAddress}'`;
        const results = await executeQuery(sql);
        if (results) {
            const [[existingPair]] = results;
            return existingPair;
        }
        return null;
    } catch (error) {
        logError("Error in checkPairExists() function:", error);
    }
};

const checkPairRankByRank = async (pairRank) => {
    try {
        const sql = `SELECT pairRank FROM pair_master WHERE pairRank = ${pairRank}`;
        const results = await executeQuery(sql);
        if (results) {
            const [pairsData] = results;
            return pairsData.length > 0;
        }
        return 0;
    }
    catch (error) {
        logError("Error in checkPairRankByRank() function:", error);
    }
};

const updatePairName = async (pairAddress, pairName) => {
    try {
        const sql = `UPDATE pair_master SET pairName = '${replaceUnwantedChar(pairName)}' WHERE pairAddress = '${pairAddress}'`
        await executeQuery(sql);
        return true;
    } catch (error) {
        logError("Error in updatePairName() function:", error);
    }
}

const getPairReserveInfo = async (pairAddress) => {
    try {
        const sql = `SELECT reserveUSD FROM pair_master WHERE pairAddress = '${pairAddress}'`
        const results = await executeQuery(sql);
        if (results) {
            const [[reserveUSD]] = results;
            return reserveUSD;
        }
        return 0;
    } catch (error) {
        logError("Error in getPairReserveInfo() function:", error);
        return 0;
    }
}

const getPairDetailsWithTokenInfo = async (pairAddress) => {
    try {
        const sql = `
        SELECT
        pm.*,
        tm0.tokenName AS token0Name,
        tm0.tokenSymbol AS token0Symbol,
        tm0.tokenDecimals AS token0Decimals,
        tm1.tokenName AS token1Name,
        tm1.tokenSymbol AS token1Symbol,
        tm1.tokenDecimals AS token1Decimals
        FROM
        pair_master pm
        LEFT JOIN token_master tm0 ON pm.tokenAddress0 = tm0.tokenAddress
        LEFT JOIN token_master tm1 ON pm.tokenAddress1 = tm1.tokenAddress
        WHERE pm.pairAddress = '${pairAddress}'
      `;
        const results = await executeQuery(sql);
        if (results) {
            const [[pairDetails]] = results;
            return pairDetails;
        }
        return null;

        // const result = pairDetails.map(pair => ({
        //     pairId: pair.pairId,
        //     pairAddress: pair.pairAddress,
        //     pairName: pair.pairName,
        //     pairRank: pair.pairRank,
        //     token0: {
        //         tokenAddress: pair.tokenAddress0,
        //         tokenName: pair.token0Name,
        //         tokenSymbol: pair.token0Symbol,
        //         tokenDecimals: pair.token0Decimals,
        //     },
        //     token1: {
        //         tokenAddress: pair.tokenAddress1,
        //         tokenName: pair.token1Name,
        //         tokenSymbol: pair.token1Symbol,
        //         tokenDecimals: pair.token1Decimals,
        //     },
        // }));

    } catch (error) {
        logError('Error in getPairDetailsWithTokenInfo() function:', error);
        throw error;
    }
};

const updatePairInfo = async (pairData) => {
    try {
        const { pairAddress, totalUSD, totalAmount0, totalAmount1, priceUSDToken0, priceUSDToken1, reserve0, reserve1, reserveUSD, transactionDatetime, blockTimeStamp } = pairData
        let sql = `
            UPDATE pair_master
            SET reserve0 = CASE WHEN (lastTransactionDateTime IS NULL OR lastTransactionDateTime <= '${transactionDatetime}') THEN ${reserve0 ?? 0} ELSE reserve0 END,
                reserve1 = CASE WHEN (lastTransactionDateTime IS NULL OR lastTransactionDateTime <= '${transactionDatetime}') THEN ${reserve1 ?? 0} ELSE reserve1 END,
                reserveUSD = CASE WHEN (lastTransactionDateTime IS NULL OR lastTransactionDateTime <= '${transactionDatetime}') THEN ${(reserveUSD * 2) ?? 0} ELSE reserveUSD END,
                totalTransactions = totalTransactions + 1,
                priceUSDToken0 = CASE WHEN (lastTransactionDateTime IS NULL OR lastTransactionDateTime <= '${transactionDatetime}') THEN ${priceUSDToken0 ?? 0} ELSE priceUSDToken0 END,
                priceUSDToken1 = CASE WHEN (lastTransactionDateTime IS NULL OR lastTransactionDateTime <= '${transactionDatetime}') THEN ${priceUSDToken1 ?? 0} ELSE priceUSDToken1 END,
        `;
        if (pairData.actionType.toLowerCase() == 'swap') {
            sql += `
                volumeUSD = volumeUSD + ${totalUSD ?? 0},
                volumeToken0 = volumeToken0 + ${totalAmount0 ?? 0},
                volumeToken1 = volumeToken1 + ${totalAmount1 ?? 0},
        `;
        }
        sql += `
        lastBlockTimeStamp = CASE WHEN (lastTransactionDateTime IS NULL OR lastTransactionDateTime <= '${transactionDatetime}') THEN ${blockTimeStamp} ELSE lastBlockTimeStamp END,
        lastTransactionDateTime = CASE WHEN (lastTransactionDateTime IS NULL OR lastTransactionDateTime <= '${transactionDatetime}') THEN '${transactionDatetime}' ELSE lastTransactionDateTime END,
                updatedOn = UTC_TIMESTAMP()
            WHERE pairAddress = '${pairAddress}'
        `;

        await executeQuery(sql);
        return true;
    } catch (error) {
        logError("Error in updatePairInfo() function:", error);
        return false;
    }
};

const findAllPairDetails = async () => {
    try {
        let sql;
        sql = `CALL report_list_pairs_analytics(${null}, ${null})`;
        const results = await executeQuery(sql);
        if (results) {
            const [[pairDetails]] = results;
            return pairDetails;
        }
        return null;
    } catch (error) {
        logError('Error in findAllPairDetails() function:', error);
        throw error;
    }
};

const getPairDetailsByPairAddress = async (pairAddress) => {
    try {
        let sql;
        sql = `CALL report_pair_analytics('${pairAddress}')`;
        const results = await executeQuery(sql);
        if (results) {
            const [[[pairDetails]]] = results;
            return pairDetails;
        }
        return null;
    } catch (error) {
        logError('Error in getPairDetailsByPairAddress() function:', error);
    }
};

const findTransactionsByPairAddress = async (actionType, pairAddress, tokenAddress, accountAddress) => {
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
        logError("Error fetching Transactions by token address:", error);
        throw error;
    }
};

const findChartsByPairAddress = async (pairAddress, periodType, periodTime) => {
    try {
        let sql;
        sql = `CALL pair_chart('${pairAddress}', '${periodType}', ${periodTime})`;
        const results = await executeQuery(sql);
        if (results) {
            const [[pairChartDetails]] = results;
            return pairChartDetails;
        }
        return null;
    } catch (error) {
        logError('Error in findChartsByPairAddress() function:', error);
        throw error;
    }
};

const findPairHourlyChartByPairAddress = async (pairAddress, periodType, periodTime) => {
    try {
        let sql;
        sql = `CALL pair_hourly_candle_chart('${pairAddress}', '${periodType}', ${periodTime})`;
        const results = await executeQuery(sql);
        if (results) {
            const [[pairHourlyChartDetails]] = results;
            return pairHourlyChartDetails;
        }
        return null;
    } catch (error) {
        logError('Error in findPairHourlyChartByPairAddress() function:', error);
        throw error;
    }
};

const searchPairDetails = async (q) => {
    try {
        let sql = `
            SELECT
            pm.pairAddress AS address,
            pm.pairName AS name,
            tm0.tokenIcon AS tokenIcon0,
            tm1.tokenIcon AS tokenIcon1
        FROM
            pair_master pm
        LEFT JOIN
            token_master tm0 ON pm.tokenAddress0 = tm0.tokenAddress
        LEFT JOIN
            token_master tm1 ON pm.tokenAddress1 = tm1.tokenAddress
        WHERE
            pm.pairAddress = '${q}' OR pm.pairName LIKE '%${q}%' OR ('${q}' = '' OR '${q}' IS NULL)
            `;
        const results = await executeQuery(sql);
        if (results) {
            const [pairDetails] = results;
            return pairDetails;
        }
        return null;
    } catch (error) {
        logError('Error in searchPairDetails() function:', error);
        throw error;
    }
};

module.exports = {
    savePairInfo,
    findAllPairDetails,
    getPairDetailsByPairAddress,
    checkPairExists,
    updatePairName,
    checkPairRankByRank,
    getPairReserveInfo,
    getPairDetailsWithTokenInfo,
    updatePairInfo,
    findTransactionsByPairAddress,
    findChartsByPairAddress,
    findPairHourlyChartByPairAddress,
    searchPairDetails
};