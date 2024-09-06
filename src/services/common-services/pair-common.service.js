const pairDbService = require("../database-services/pair-db.service");
const pairHourlyDbService = require("../database-services/pair-hourly-db.service");
const pairDailyDbService = require("../database-services/pair-daily-db.service");
const { logError } = require("./log-common.service");
const { savePairDataFromPairAddress } = require("./pair-and-token-common.service");

const updatePairData = async (transactionData) => {
    try {
        for (let data of transactionData) {
            const updateResult = await pairDbService.updatePairInfo(data);
            if (!updateResult) {
                return false;
            }
        }
        return true;
    } catch (error) {
        logError("Error in updatePairData() function:", error);
        return false;
    }
};

const updatePairHourlyData = async (transactionData) => {
    try {
        for (let data of transactionData) {
            const hourPairId = `${data.pairAddress}-${data.hourIndex}`;
            const pairDataInfo = {
                ...data,
                hourPairId
            }
            const saveOrUpdateResult = await pairHourlyDbService.saveOrUpdatePairHourlyInfo(pairDataInfo);
            if (!saveOrUpdateResult) {
                return false;
            }
        };
        return true;
    } catch (error) {
        logError("Error in updatePairHourlyData() function:", error);
        return false;
    }
};

const updatePairDailyData = async (transactionData) => {
    try {
        for (let data of transactionData) {

            const dayPairId = `${data.pairAddress}-${data.dayIndex}`;
            const pairDataInfo = {
                ...data,
                dayPairId
            }
            const saveOrUpdateResult = await pairDailyDbService.saveOrUpdatePairDailyInfo(pairDataInfo);
            if (!saveOrUpdateResult) {
                return false;
            }
        };
        return true;
    } catch (error) {
        logError("Error in updatePairDailyData() function:", error);
        return false;
    }
};

const saveAllPairDataFromPairAddresses = async (pairAddresses) => {
    try {
        let successPairAddresses = [];
        let failPairAddresses = [];
        for (let pairAddress of pairAddresses) {
            const pairCreated = await savePairDataFromPairAddress(pairAddress, -1);
            if (pairCreated) {
                successPairAddresses.push(pairAddress);
            } else {
                failPairAddresses.push(pairAddress);
            }
        }
        return { successPairAddresses, failPairAddresses }
    } catch (error) {
        logError("Error in saveAllPairDataFromPairAddresses() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

module.exports = { updatePairData, updatePairHourlyData, updatePairDailyData, saveAllPairDataFromPairAddresses }