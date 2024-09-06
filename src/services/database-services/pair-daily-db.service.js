const { executeQuery } = require('../../db/db-query');
const { logError, logDebug } = require('../common-services/log-common.service');

const insertPairDailyInfo = async (pairData) => {
    try {
        const { dayPairId, pairAddress, dayStartTimeStamp, dayStartDateTime } = pairData;
        const sql = `
                INSERT INTO pair_daily
                (dayPairId, pairAddress, dayStartTimeStamp, dayStartDateTime, createdOn, updatedOn)
                VALUES
                ('${dayPairId}', '${pairAddress}', ${dayStartTimeStamp}, '${dayStartDateTime}', UTC_TIMESTAMP(), UTC_TIMESTAMP())
            `;
        await executeQuery(sql);
        logDebug("Pair Daily saved to database");
        return true;
    } catch (error) {
        logError("Error in insertPairDailyInfo() function:", error);
        return false;
    }
};

const saveOrUpdatePairDailyInfo = async (pairData) => {
    try {
        const { dayPairId } = pairData;

        const existingDailyPair = await checkPairDailyExists(dayPairId);
        if (!existingDailyPair) {
            const insertResult = await insertPairDailyInfo(pairData);
            if (!insertResult) {
                return false;
            }
        }
        const updateResult = await updatePairDailyInfo(pairData);
        return updateResult;
    } catch (error) {
        logError("Error in saveOrUpdatePairDailyInfo() function:", error);
        return false;
    }
};

const checkPairDailyExists = async (dayPairId) => {
    try {
        const sql = `
            SELECT dayPairId
            FROM pair_daily
            WHERE dayPairId = '${dayPairId}'
        `;
        const results = await executeQuery(sql);
        if (results) {
            const [existingPairDaily] = results;
            return existingPairDaily.length > 0;
        }
        return 0;
    } catch (error) {
        logError("Error in checkPairDailyExists() function:", error);
        return false;
    }
};

const updatePairDailyInfo = async (pairData) => {
    try {
        const { dayPairId, priceUSDToken0, priceUSDToken1, totalAmount0, totalAmount1, totalUSD, reserve0, reserve1, reserveUSD } = pairData
        let sql = `
            UPDATE pair_daily
            SET reserve0 = ${reserve0 ?? 0},
                reserve1 = ${reserve1 ?? 0},
                reserveUSD = ${(reserveUSD * 2) ?? 0},
                dailyTransactions = dailyTransactions + 1,
                priceUSDToken0 = ${priceUSDToken0 ?? 0},
                priceUSDToken1 = ${priceUSDToken1 ?? 0},
        `;
        if (pairData.actionType.toLowerCase() == 'swap') {
            sql += `
                dailyVolumeUSD = dailyVolumeUSD + ${totalUSD ?? 0},
                dailyVolumeToken0 = dailyVolumeToken0 + ${totalAmount0 ?? 0},
                dailyVolumeToken1 = dailyVolumeToken1 + ${totalAmount1 ?? 0},
        `;
        }
        sql += `
                updatedOn = UTC_TIMESTAMP()
            WHERE dayPairId = '${dayPairId}'
        `;
        await executeQuery(sql);
        return true;
    } catch (error) {
        logError("Error in updatePairDailyInfo() function:", error);
        return false;
    }
};

module.exports = {
    insertPairDailyInfo,
    saveOrUpdatePairDailyInfo,
    checkPairDailyExists
};
