const { executeQuery } = require('../../db/db-query');
const { logError } = require('../common-services/log-common.service');

const getGeneralSettings = async () => {
    try {
        const sql = `SELECT * FROM general_setting ORDER BY id LIMIT 1`;
        const results = await executeQuery(sql);
        if (results) {
            const [[generalSettings]] = results;
            return generalSettings;
        }
        return null;
    } catch (error) {
        logError("Error in getTransactionQueueCountAndSeconds() function:", error);
    }
}

const getTransactionQueueCountAndSeconds = async () => {
    try {
        const sql = `SELECT queueProcessCount, queueWaitSeconds FROM general_setting ORDER BY id LIMIT 1`;
        const results = await executeQuery(sql);
        if (results) {
            const [[transactionQueue]] = results;
            return transactionQueue;
        }
        return null;
    } catch (error) {
        logError("Error in getTransactionQueueCountAndSeconds() function:", error);
    }
}

const getLastSyncPairRank = async () => {
    try {
        const sql = `SELECT lastSyncPairRank FROM general_setting`;
        const results = await executeQuery(sql);
        if (results) {
            const [[settingsData]] = results;
            return settingsData ? settingsData.lastSyncPairRank : -1;
        }
        return -1;
    } catch (error) {
        logError("Error updating getLastSyncPairRank() function:", error);
    }
};

const updateLastSyncPairRank = async (pairRank) => {
    try {
        const sql = `UPDATE general_setting SET lastSyncPairRank = ${pairRank}`;
        await executeQuery(sql);
    } catch (error) {
        logError("Error updating updateLastSyncPairRank() function:", error);
    }
};

const getLastSyncBlockNumber = async () => {
    try {
        const sql = `SELECT lastSyncBlockNumber FROM general_setting`;
        const results = await executeQuery(sql);
        if (results) {
            const [[settingsData]] = results;
            return settingsData ? settingsData.lastSyncBlockNumber : 0;
        }
        return 0;
    } catch (error) {
        logError("Error in getLastSyncBlockNumber() function:", error);
    }
};

const updateLastSyncBlockNumber = async (blockNumber) => {
    try {
        const sql = `UPDATE general_setting SET lastSyncBlockNumber = ${blockNumber}`;
        await executeQuery(sql);
    } catch (error) {
        logError("Error in updateLastSyncBlockNumber() function:", error);
    }
};

const updateNativeTokenUSDPriceInDB = async (nativeTokenUSDRate) => {
    try {
        if (nativeTokenUSDRate > 0) {
            const sql = `
                UPDATE general_setting
                SET NativeTokenUSDRate = ${nativeTokenUSDRate}, lastPriceFetchDateTime = UTC_TIMESTAMP()
            `;
            await executeQuery(sql);
            // console.log("Native Token price updated in the database successfully");
        }
    } catch (error) {
        logError("Error updating ETH price in the database:", error);
        throw error;
    }
};

const isExternalRateNeedToFetch = async () => {
    try {
        const sql = `
            SELECT *, UTC_TIMESTAMP() AS currentUTCDateTime, UTC_TIMESTAMP() >= nextPriceFetchDateTime AS RequiredRateFetch
            FROM (
                SELECT *, DATE_ADD(lastPriceFetchDateTime, INTERVAL priceFetchIntervalSeconds SECOND) AS nextPriceFetchDateTime
                FROM general_setting
            ) AS a`;
        const results = await executeQuery(sql);
        if (results) {
            const [[finalResults]] = results;
            return finalResults;
        }
        return null;
    } catch (error) {
        logError("Error in isExternalRateNeedToFetch() function:", error);
    }
}

const getFeeToAddress = async () => {
    try {
        const sql = `SELECT feeToAddress FROM general_setting`;
        const results = await executeQuery(sql);
        if (results) {
            const [[finalResults]] = results;
            return finalResults.feeToAddress ?? '';
        }
    } catch (error) {
        logError("Error in getFeeToAddress() function:", error);
    }
};

const updateFeeToAddress = async (feeToAddress) => {
    try {
        const sql = `UPDATE general_setting SET feeToAddress = '${feeToAddress}'`;
        const results = await executeQuery(sql);
        if (results) {
            const [finalResults] = results;
            return finalResults;
        }
        return null;
    } catch (error) {
        logError("Error in updateFeeToAddress() function:", error);
    }
};

const updateLastSyncBlockNumberInfo = async (blockNumber) => {
    try {
        const sql = `UPDATE general_setting
            SET lastSyncBlockNumber = ${blockNumber}`;
        await executeQuery(sql);
    } catch (error) {
        logError("Error in updateLastSyncBlockNumberInfo() function:", error);
    }
}

module.exports = {
    getGeneralSettings,
    getTransactionQueueCountAndSeconds,
    getLastSyncPairRank,
    updateLastSyncPairRank,
    getLastSyncBlockNumber,
    updateLastSyncBlockNumber,
    updateNativeTokenUSDPriceInDB,
    isExternalRateNeedToFetch,
    getFeeToAddress,
    updateFeeToAddress,
    updateLastSyncBlockNumberInfo
}