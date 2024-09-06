const { executeQuery } = require('../../db/db-query');
const { logError, logDebug } = require('../common-services/log-common.service');

const insertTokenHourlyInfo = async (tokenData) => {
    try {
        const { hourTokenId, tokenAddress, hourStartUnix, hourStartDateTime } = tokenData;
        const sql = `
                INSERT INTO token_hourly
                (hourTokenId, tokenAddress, hourStartUnix, hourStartDateTime, createdOn, updatedOn)
                VALUES
                ('${hourTokenId}', '${tokenAddress}', ${hourStartUnix}, '${hourStartDateTime}', UTC_TIMESTAMP(), UTC_TIMESTAMP())
            `;
        await executeQuery(sql);
        logDebug("Token Hourly saved to database");
        return true;
    } catch (error) {
        logError("Error in insertTokenHourlyInfo() function:", error);
        return false;
    }
};

const saveOrUpdateTokenHourlyInfo = async (tokenData) => {
    try {
        const { hourTokenId } = tokenData;

        const existingHourlyToken = await checkTokenHourlyExists(hourTokenId);
        if (!existingHourlyToken) {
            const insertResult = await insertTokenHourlyInfo(tokenData);
            if (!insertResult) {
                return false;
            }
        }
        const updateResult = await updateTokenHourlyInfo(tokenData);
        return updateResult;
    } catch (error) {
        logError("Error in saveOrUpdateTokenHourlyInfo() function:", error);
        return false;
    }
};

const checkTokenHourlyExists = async (hourTokenId) => {
    try {
        const sql = `
            SELECT hourTokenId
            FROM token_hourly
            WHERE hourTokenId = '${hourTokenId}'
        `;
        const results = await executeQuery(sql);
        if (results) {
            const [existingTokenHourly] = results;
            return existingTokenHourly.length > 0;
        }
        return 0;
    } catch (error) {
        logError("Error in checkTokenHourlyExists() function:", error);
        return false;
    }
};

const updateTokenHourlyLiquidity = async (tokenAddress, hourStartUnix) => {
    try {
        let sql;
        sql = `CALL update_token_liquidity_hourly('${tokenAddress}', ${hourStartUnix})`;
        await executeQuery(sql);
        return true
    } catch (error) {
        logError('Error in updateTokenHourlyLiquidity() function:', error);
        return false;
    }
};

const updateTokenHourlyInfo = async (tokenData) => {
    try {
        const { hourTokenId, priceUSD, totalAmount, totalAmountNativeToken, reserveNativeToken, totalUSD, reserve, reserveUSD } = tokenData
        let sql = `
            UPDATE token_hourly
            SET totalLiquidityNativeToken = totalLiquidityNativeToken + ${isFinite(totalAmountNativeToken) ? totalAmountNativeToken : 0},
                hourlyTransactions = hourlyTransactions + 1,
                priceUSD = ${priceUSD ?? 0},
        `;
        if (tokenData.actionType.toLowerCase() == 'swap') {
            sql += `
                hourlyVolumeUSD = hourlyVolumeUSD + ${totalUSD ?? 0},
                hourlyVolumeToken = hourlyVolumeToken + ${totalAmount ?? 0},
                hourlyVolumeNativeToken = hourlyVolumeNativeToken + ${isFinite(reserveNativeToken) ? reserveNativeToken : 0},
        `;
        }
        sql += `
                updatedOn = UTC_TIMESTAMP()
            WHERE hourTokenId = '${hourTokenId}'
        `;
        await executeQuery(sql);
        return true;
    } catch (error) {
        logError("Error in updateTokenHourlyInfo() function:", error);
        return false;
    }
};

module.exports = {
    insertTokenHourlyInfo,
    saveOrUpdateTokenHourlyInfo,
    checkTokenHourlyExists,
    updateTokenHourlyLiquidity
};
