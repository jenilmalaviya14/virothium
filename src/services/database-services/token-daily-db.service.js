const { executeQuery } = require('../../db/db-query');
const { logError, logDebug } = require('../common-services/log-common.service');

const insertTokenDailyInfo = async (tokenData) => {
    try {
        const { dayTokenId, tokenAddress, dayStartTimeStamp, dayStartDateTime } = tokenData;
        const sql = `
                INSERT INTO token_daily
                (dayTokenId, tokenAddress, dayStartTimeStamp, dayStartDateTime, createdOn, updatedOn)
                VALUES
                ('${dayTokenId}', '${tokenAddress}', ${dayStartTimeStamp}, '${dayStartDateTime}', UTC_TIMESTAMP(), UTC_TIMESTAMP())
            `;
        await executeQuery(sql);
        logDebug("Token Daily saved to database");
        return true;
    } catch (error) {
        logError("Error in insertTokenDailyInfo() function:", error);
        return false;
    }
};

const saveOrUpdateTokenDailyInfo = async (tokenData) => {
    try {
        const { dayTokenId } = tokenData;

        const existingDailyToken = await checkTokenDailyExists(dayTokenId);
        if (!existingDailyToken) {
            const insertResult = await insertTokenDailyInfo(tokenData);
            if (!insertResult) {
                return false;
            }
        }
        const updateResult = await updateTokenDailyInfo(tokenData);
        return updateResult;
    } catch (error) {
        logError("Error in saveOrUpdateTokenDailyInfo() function:", error);
        return false;
    }
};

const checkTokenDailyExists = async (dayTokenId) => {
    try {
        const sql = `
            SELECT dayTokenId
            FROM token_daily
            WHERE dayTokenId = '${dayTokenId}'
        `;
        const results = await executeQuery(sql);
        if (results) {
            const [existingTokenDaily] = results;
            return existingTokenDaily.length > 0;;
        }
        return 0;
    } catch (error) {
        logError("Error in checkTokenDailyExists() function:", error);
        return false;
    }
};

const updateTokenDailyLiquidity = async (tokenAddress, dayStartTimeStamp) => {
    try {
        let sql;
        sql = `CALL update_token_liquidity_daily('${tokenAddress}', ${dayStartTimeStamp})`;
        await executeQuery(sql);
        return true
    } catch (error) {
        logError('Error in updateTokenDailyLiquidity() function:', error);
        return false;
    }
};

// totalLiquidityNativeToken = ${totalAmountNativeToken ?? 0},
// dailyVolumeNativeToken = dailyVolumeNativeToken + ${reserveNativeToken ?? 0},
const updateTokenDailyInfo = async (tokenData) => {
    logDebug(`tokenData: `, tokenData);
    try {
        const { dayTokenId, priceUSD, totalAmount, reserveNativeToken, totalAmountNativeToken, totalUSD, reserve, reserveUSD } = tokenData
        let sql = `
            UPDATE token_daily
            SET totalLiquidityToken = ${reserve ?? 0},
                totalLiquidityUSD = ${reserveUSD ?? 0},
                totalLiquidityNativeToken = totalLiquidityNativeToken + ${isFinite(totalAmountNativeToken) ? totalAmountNativeToken : 0},
                dailyTransactions = dailyTransactions + 1,
                priceUSD = ${priceUSD ?? 0},
        `;
        if (tokenData.actionType.toLowerCase() == 'swap') {
            sql += `
                dailyVolumeUSD = dailyVolumeUSD + ${totalUSD ?? 0},
                dailyVolumeToken = dailyVolumeToken + ${totalAmount ?? 0},
                dailyVolumeNativeToken = dailyVolumeNativeToken + ${isFinite(reserveNativeToken) ? reserveNativeToken : 0},
        `;
        }
        sql += `
                updatedOn = UTC_TIMESTAMP()
            WHERE dayTokenId = '${dayTokenId}'
        `;
        await executeQuery(sql);
        return true;
    } catch (error) {
        logError("Error in updateTokenDailyInfo() function:", error);
        return false;
    }
};

module.exports = {
    insertTokenDailyInfo,
    saveOrUpdateTokenDailyInfo,
    checkTokenDailyExists,
    updateTokenDailyLiquidity
};
