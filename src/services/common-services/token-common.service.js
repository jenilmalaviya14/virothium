const tokenDbService = require("../database-services/token-db.service");
const tokenHourlyDbService = require("../database-services/token-hourly-db.service");
const tokenDailyDbService = require("../database-services/token-daily-db.service");
const { logError } = require("./log-common.service");

const updateTokenData = async (transactionData) => {
    try {
        for (let data of transactionData) {
            const token0Data = {
                tokenAddress: data.tokenAddress0,
                totalAmount: data.totalAmount0,
                priceUSD: data.priceUSDToken0,
                totalUSD: data.totalUSD,
                reserve: data.reserve0,
                reserveUSD: data.reserveUSD,
                actionType: data.actionType,
                lastTransactionDateTime: data.transactionDatetime,
                lastBlockTimeStamp: data.blockTimeStamp
            }
            const updateToken0Result = await tokenDbService.updateTokenInfo(token0Data);
            await tokenDbService.updateTokenLiquidity(data.tokenAddress0);
            if (!updateToken0Result) {
                return false;
            }

            const token1Data = {
                tokenAddress: data.tokenAddress1,
                totalAmount: data.totalAmount1,
                priceUSD: data.priceUSDToken1,
                totalUSD: data.totalUSD,
                reserve: data.reserve1,
                reserveUSD: data.reserveUSD,
                actionType: data.actionType,
                lastTransactionDateTime: data.transactionDatetime,
                lastBlockTimeStamp: data.blockTimeStamp
            }
            const updateToken1Result = await tokenDbService.updateTokenInfo(token1Data);
            await tokenDbService.updateTokenLiquidity(data.tokenAddress1);
            if (!updateToken1Result) {
                return false;
            }
        }
        return true;
    } catch (error) {
        logError("Error in updateTokenData() function:", error);
        return false;
    }
};

const updateTokenHourlyData = async (transactionData) => {
    try {
        for (let data of transactionData) {
            const token0Data = {
                hourTokenId: `${data.tokenAddress0}-${data.hourIndex}`,
                hourStartUnix: data.hourStartUnix,
                hourStartDateTime: data.hourStartDateTime,
                tokenAddress: data.tokenAddress0,
                totalAmount: data.totalAmount0,
                priceUSD: data.priceUSDToken0,
                totalUSD: data.totalUSD,
                totalAmountNativeToken: data.totalAmountNativeToken,
                reserve: data.reserve0,
                reserveUSD: data.reserveUSD,
                reserveNativeToken: data.reserveNativeToken,
                actionType: data.actionType
            }
            const updateToken0Result = await tokenHourlyDbService.saveOrUpdateTokenHourlyInfo(token0Data);
            await tokenHourlyDbService.updateTokenHourlyLiquidity(data.tokenAddress0, data.hourStartUnix);
            if (!updateToken0Result) {
                return false;
            }

            const token1Data = {
                hourTokenId: `${data.tokenAddress1}-${data.hourIndex}`,
                hourStartUnix: data.hourStartUnix,
                hourStartDateTime: data.hourStartDateTime,
                tokenAddress: data.tokenAddress1,
                totalAmount: data.totalAmount1,
                priceUSD: data.priceUSDToken1,
                totalUSD: data.totalUSD,
                totalAmountNativeToken: data.totalAmountNativeToken,
                reserve: data.reserve1,
                reserveUSD: data.reserveUSD,
                reserveNativeToken: data.reserveNativeToken,
                actionType: data.actionType
            }
            const updateToken1Result = await tokenHourlyDbService.saveOrUpdateTokenHourlyInfo(token1Data);
            await tokenHourlyDbService.updateTokenHourlyLiquidity(data.tokenAddress1, data.hourStartUnix);
            if (!updateToken1Result) {
                return false;
            }
        }
        return true;
    } catch (error) {
        logError("Error in updateTokenHourlyData() function:", error);
        return false;
    }
};

const updateTokenDailyData = async (transactionData) => {
    try {
        for (let data of transactionData) {
            const token0Data = {
                dayTokenId: `${data.tokenAddress0}-${data.dayIndex}`,
                dayStartTimeStamp: data.dayStartTimeStamp,
                dayStartDateTime: data.dayStartDateTime,
                tokenAddress: data.tokenAddress0,
                totalAmount: data.totalAmount0,
                priceUSD: data.priceUSDToken0,
                totalUSD: data.totalUSD,
                totalAmountNativeToken: data.totalAmountNativeToken,
                reserve: data.reserve0,
                reserveUSD: data.reserveUSD,
                reserveNativeToken: data.reserveNativeToken,
                actionType: data.actionType
            }
            const updateToken0Result = await tokenDailyDbService.saveOrUpdateTokenDailyInfo(token0Data);
            await tokenDailyDbService.updateTokenDailyLiquidity(data.tokenAddress0, data.dayStartTimeStamp);
            if (!updateToken0Result) {
                return false;
            }

            const token1Data = {
                dayTokenId: `${data.tokenAddress1}-${data.dayIndex}`,
                dayStartTimeStamp: data.dayStartTimeStamp,
                dayStartDateTime: data.dayStartDateTime,
                tokenAddress: data.tokenAddress1,
                totalAmount: data.totalAmount1,
                priceUSD: data.priceUSDToken1,
                totalUSD: data.totalUSD,
                totalAmountNativeToken: data.totalAmountNativeToken,
                reserve: data.reserve1,
                reserveUSD: data.reserveUSD,
                reserveNativeToken: data.reserveNativeToken,
                actionType: data.actionType
            }
            const updateToken1Result = await tokenDailyDbService.saveOrUpdateTokenDailyInfo(token1Data);
            await tokenDailyDbService.updateTokenDailyLiquidity(data.tokenAddress1, data.dayStartTimeStamp);
            if (!updateToken1Result) {
                return false;
            }
        };
        return true;
    } catch (error) {
        logError("Error in updateTokenDailyData() function:", error);
        return false;
    }
};

module.exports = { updateTokenData, updateTokenHourlyData, updateTokenDailyData }