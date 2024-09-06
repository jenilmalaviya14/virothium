const tokenDbService = require("../database-services/token-db.service");
const pairDbService = require("../database-services/pair-db.service");
const pairContractService = require("../contract-services/pair-contract.service");
const pairHourlyService = require("../database-services/pair-hourly-db.service");
const { logError, logDebug } = require("../common-services/log-common.service");

const savePairData = async (pairData) => {
    try {
        logDebug("savePairData", pairData)
        const savedPairData = await pairDbService.savePairInfo(pairData);
        const savedTokenData0 = await tokenDbService.saveTokenInfo(pairData.tokenAddress0);
        const savedTokenData1 = await tokenDbService.saveTokenInfo(pairData.tokenAddress1);

        const pairName = `${savedTokenData0.tokenSymbol} - ${savedTokenData1.tokenSymbol}`
        const isPairDataSaved = await pairDbService.updatePairName(pairData.pairAddress, pairName);
        return isPairDataSaved;
    } catch (error) {
        logError("Error in savePairData() function:", error);
    }
};

const savePairDataFromPairAddress = async (pairAddress, pairRank) => {
    try {
        // const pairRank = 500; // temporary value for testing purposes
        const tokenAddresses = await pairContractService.getTokenAddressesFromPair(pairAddress);
        const pairData = {
            pairAddress,
            pairRank,
            tokenAddress0: tokenAddresses.token0,
            tokenAddress1: tokenAddresses.token1
        };
        const isPairDataSaved = await savePairData(pairData);

        return isPairDataSaved;
    } catch (error) {
        logError("Error in savePairDataFromPairAddress() function:", error);
    }
};


module.exports = { savePairData, savePairDataFromPairAddress }