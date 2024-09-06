const axios = require('axios');
const { updateNativeTokenUSDPriceInDB, isExternalRateNeedToFetch } = require("../database-services/general-setting-db.service");
const { logDebug, logError } = require('./log-common.service');

const convertBigAmountToSmallAmount = (bigAmount, decimals) => {
    return (Number(bigAmount) / Number(BigInt(10 ** decimals)));
};

const convertSmallAmountToBigAmount = (smallAmount, decimals) => {
    return (BigInt(smallAmount) * BigInt(10 ** decimals));
};

const getHourStartIndex = (blockTimeStamp) => {
    const startingDate = new Date(0);
    const currentDate = new Date(blockTimeStamp);
    const differenceInMilliseconds = currentDate - startingDate;
    const hourIndex = Math.floor(differenceInMilliseconds / (1000 * 60 * 60));
    return hourIndex;
};

const getStartUnix = (blockTimeStamp) => {
    // const UTCDateTime = getUTCDateTimeFromTimeStamp(blockTimeStamp);
    const hourStartUnix = new Date(blockTimeStamp).setUTCMinutes(0, 0, 0);
    return hourStartUnix;
};

const getDayIndex = (blockTimeStamp) => {
    const startingDate = new Date(0);
    const currentDate = new Date(blockTimeStamp);
    const differenceInMilliseconds = currentDate - startingDate;
    const dayIndex = Math.floor(differenceInMilliseconds / (1000 * 60 * 60 * 24));
    return dayIndex;
};

const getDayStartTimeStamp = (blockTimeStamp) => {
    // const UTCDateTime = getUTCDateTimeFromTimeStamp(blockTimeStamp);
    const dayStartTimeStamp = new Date(blockTimeStamp).setUTCHours(0, 0, 0, 0);
    return dayStartTimeStamp;
};

const getLastHourStartUnix = (hours = 1) => {
    const currentDate = new Date().setMinutes(0, 0, 0);
    const millisecondsInHour = (1000 * 60 * 60);
    let lastHourStartUnix = currentDate - (millisecondsInHour * hours);
    logDebug(`lastHourStartUnix: `, lastHourStartUnix);
    return lastHourStartUnix;
}

const getLast7DaysStartUnix = (days = 7) => {
    const currentDate = new Date().setHours(0, 0, 0, 0);
    const millisecondsInDay = (1000 * 60 * 60 * 24);
    const last7DaysStartUnix = currentDate - (millisecondsInDay * days);
    logDebug(`last7DaysStartUnix: `, last7DaysStartUnix);
    return last7DaysStartUnix;
}

const getUTCDateTimeFromTimeStamp = (timestamp) => {
    const timestampDate = new Date(timestamp);
    return getUTCDateTimeFromDateTime(timestampDate);
}

const getUTCDateTimeFromDateTime = (timestampDate) => {
    return timestampDate.toISOString().replace(/T/, ' ').replace(/\..+/, '');
}

const getExternalUSDRate = async (dynamicTokenName) => {
    try {
        const url = `${process.env.EXTERNALUSDAPI_URL}ids=${dynamicTokenName}&vs_currencies=usd`;
        logDebug("url", url);
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json'
            }
        });
        // logDebug(response)

        // console.log(response.data);
        const res = response.data;
        if (res && res[dynamicTokenName] && res[dynamicTokenName].usd) {
            logDebug(`EXTRNAL USD RATE: `, res[dynamicTokenName].usd);
            return res[dynamicTokenName].usd;
        }

        return 0;
    } catch (error) {
        logError('getExternalUSDRate There was a problem with your axios request:', error);
        return 0;
    }
};

const compareExternalUSDRateWithNativeUSDRate = (externalDynamicTokenName, externalUSDRate, nativeUSDRate) => {
    try {
        if (externalUSDRate == 0) {
            const nativeTokenName = process.env.NATIVE_TOKEN_NAME
            if (nativeTokenName.toLowerCase() == externalDynamicTokenName.toLowerCase()) {
                return nativeUSDRate
            }
        }
        return externalUSDRate
    } catch (error) {
        logError("compareExternalUSDRateWithNativeUSDRate error:", error);
        return externalUSDRate;
    }
}

const getExternalOrNativeUSDRate = async (externalDynamicTokenName, nativeUSDRate) => {
    try {
        const nativeTokenName = process.env.NATIVE_TOKEN_NAME
        if (nativeTokenName.toLowerCase() == externalDynamicTokenName.toLowerCase()) {
            return nativeUSDRate
        }
        const externalUSDRate = await getExternalUSDRate(externalDynamicTokenName);
        return externalUSDRate
    } catch (error) {
        logError("getExternalOrNativeUSDRate error:", error);
        return 0;
    }
}

const getNativeTokenUSDRate = async (forceRateUpdate = false) => {
    try {
        let nativeTokenUSDRate = 0
        if (forceRateUpdate) {
            nativeTokenUSDRate = await fetchAndUpdateNativeTokenUSDRate()
            logDebug("forceRateUpdate nativeTokenUSDRate if", nativeTokenUSDRate);
        } else {
            const externalRateNeedToFetchResult = await isExternalRateNeedToFetch();
            logDebug("externalRateNeedToFetchResult else nativeTokenUSDRate", externalRateNeedToFetchResult);
            if (externalRateNeedToFetchResult.RequiredRateFetch) {
                nativeTokenUSDRate = await fetchAndUpdateNativeTokenUSDRate()
                logDebug("externalRateNeedToFetchResult.RequiredRateFetch if nativeTokenUSDRate", nativeTokenUSDRate);
                if (nativeTokenUSDRate == 0) {
                    nativeTokenUSDRate = externalRateNeedToFetchResult.NativeTokenUSDRate
                    logDebug("externalRateNeedToFetchResult.RequiredRateFetch if nativeTokenUSDRate == 0", nativeTokenUSDRate);
                }
            } else {
                nativeTokenUSDRate = externalRateNeedToFetchResult.NativeTokenUSDRate
                logDebug("externalRateNeedToFetchResult.RequiredRateFetch else nativeTokenUSDRate", nativeTokenUSDRate);
            }
        };
        logDebug("getNativeTokenUSDRate", nativeTokenUSDRate);
        return nativeTokenUSDRate;
    } catch (error) {
        logError('There was a problem with your axios request:', error);
        return 0;
    }
};

const fetchAndUpdateNativeTokenUSDRate = async () => {
    const nativeTokenName = process.env.NATIVE_TOKEN_NAME;
    const nativeTokenUSDRate = await getExternalUSDRate(nativeTokenName);
    logDebug("fetchAndUpdateNativeTokenUSDRate nativeTokenUSDRate", nativeTokenUSDRate)
    if (nativeTokenUSDRate > 0) {
        await updateNativeTokenUSDPriceInDB(nativeTokenUSDRate);
    }
    return nativeTokenUSDRate;
}

module.exports = {
    convertBigAmountToSmallAmount,
    convertSmallAmountToBigAmount,
    getHourStartIndex,
    getStartUnix,
    getDayIndex,
    getDayStartTimeStamp,
    getLastHourStartUnix,
    getLast7DaysStartUnix,
    getExternalUSDRate,
    compareExternalUSDRateWithNativeUSDRate,
    getExternalOrNativeUSDRate,
    getNativeTokenUSDRate,
    getUTCDateTimeFromTimeStamp,
    getUTCDateTimeFromDateTime
}

// startListen();