const { executeQuery } = require('../../db/db-query');
const { logError, logDebug } = require('../common-services/log-common.service');

const insertPairHourlyInfo = async (pairData) => {
    try {
        const { hourPairId, pairAddress, hourStartUnix, hourStartDateTime } = pairData;
        const sql = `
                INSERT INTO pair_hourly
                (hourPairId, pairAddress, hourStartUnix, hourStartDateTime, createdOn, updatedOn)
                VALUES
                ('${hourPairId}', '${pairAddress}', ${hourStartUnix}, '${hourStartDateTime}', UTC_TIMESTAMP(), UTC_TIMESTAMP())
            `;
        await executeQuery(sql);
        logDebug("Pair Hourly saved to database");
        return true;
    } catch (error) {
        logError("Error in insertPairHourlyInfo() function:", error);
        return false;
    }
};

const saveOrUpdatePairHourlyInfo = async (pairData) => {
    try {
        const { hourPairId } = pairData;

        const existingHourlyPair = await checkPairHourlyExists(hourPairId);
        if (!existingHourlyPair) {
            const insertResult = await insertPairHourlyInfo(pairData);
            if (!insertResult) {
                return false;
            }
        }
        const updateResult = await updatePairHourlyInfo(pairData);
        return updateResult;
    } catch (error) {
        logError("Error in saveOrUpdatePairHourlyInfo() function:", error);
        return false;
    }
};

const checkPairHourlyExists = async (hourPairId) => {
    try {
        const sql = `
            SELECT hourPairId
            FROM pair_hourly
            WHERE hourPairId = '${hourPairId}'
        `;
        const results = await executeQuery(sql);
        if (results) {
            const [existingPairHourly] = results;
            return existingPairHourly.length > 0;;
        }
        return 0;
    } catch (error) {
        logError("Error in checkPairHourlyExists() function:", error);
        return false;
    }
};

const updatePairHourlyInfo = async (pairData) => {
    try {
        const { hourPairId, priceUSDToken0, priceUSDToken1, totalAmount0, totalAmount1, totalUSD, reserve0, reserve1, reserveUSD } = pairData

        let sql = `
            UPDATE pair_hourly
            SET reserve0 = ${reserve0 ?? 0},
                reserve1 = ${reserve1 ?? 0},
                reserveUSD = ${(reserveUSD * 2) ?? 0},
                hourlyTransactions = hourlyTransactions + 1,
                priceUSDToken0 = ${priceUSDToken0 ?? 0},
                priceUSDToken1 = ${priceUSDToken1 ?? 0},
        `;
        if (pairData.actionType.toLowerCase() == 'swap') {
            sql += `
                hourlyVolumeUSD = hourlyVolumeUSD + ${totalUSD ?? 0},
                hourlyVolumeToken0 = hourlyVolumeToken0 + ${totalAmount0 ?? 0},
                hourlyVolumeToken1 = hourlyVolumeToken1 + ${totalAmount1 ?? 0},
        `;
        }
        sql += `
                updatedOn = UTC_TIMESTAMP()
            WHERE hourPairId = '${hourPairId}'
        `;
        await executeQuery(sql);
        return true;
    } catch (error) {
        logError("Error in updatePairHourlyInfo() function:", error);
        return false;
    }
};

module.exports = {
    insertPairHourlyInfo,
    saveOrUpdatePairHourlyInfo,
    checkPairHourlyExists
};
