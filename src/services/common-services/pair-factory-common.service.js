const { getFactoryInfoFromContract } = require("../contract-services/factory-contract.service");
const { getTokenAddressesFromPair } = require("../contract-services/pair-contract.service");
const { savePairDataFromPairAddress } = require('../common-services/pair-and-token-common.service');
const generalSetting = require('../database-services/general-setting-db.service');
const { checkPairRankByRank, checkPairExists } = require("../database-services/pair-db.service");
const { logError, logDebug } = require("./log-common.service");
const factoryABI = require("../../abi/factoryabi.json");
const ethers = require("ethers");

const savePairDataWithFactoryInfo = async () => {
    try {
        const factoryAddress = process.env.VINOTHIUM_CONTRACT_ADDRESS;
        const factoryInfo = await getFactoryInfoFromContract(factoryAddress);
        // const totalPairs = factoryInfo.totalPairs.toNumber();

        const totalPairs = 15;

        const startPairRank = await generalSetting.getLastSyncPairRank();
        for (let pairRank = startPairRank + 1; pairRank < totalPairs; pairRank++) {
            const pairExists = await checkPairRankByRank(pairRank)
            if (!pairExists) {
                const pairAddress = await factoryInfo.getPair(pairRank);
                const isPairDataSaved = await savePairDataFromPairAddress(pairAddress, pairRank);
                if (isPairDataSaved) {
                    await generalSetting.updateLastSyncPairRank(pairRank);
                }
            }
        }
        logDebug("All pairs data saved successfully.");
    } catch (error) {
        logError("Error in savePairDataWithFactoryInfo() function:", error);
    }
};

const eventFilter5WithPagination = async () => {
    try {
        const url = process.env.VINOTHIUM_URL;
        const contractAddress = process.env.VINOTHIUM_CONTRACT_ADDRESS;
        const provider = new ethers.providers.JsonRpcProvider(url);
        const iface = new ethers.utils.Interface(factoryABI);

        let logs = [];
        let blockNumberIndex = await provider.getBlockNumber();
        const numberOfResponses = 1;
        const blockNumberStart = 0;

        while (logs.length < numberOfResponses && blockNumberIndex >= blockNumberStart) {
            const fromBlock = Math.max(blockNumberIndex - 5, blockNumberStart);
            const tempLogs = await provider.getLogs({
                address: contractAddress,
                fromBlock: ethers.utils.hexValue(fromBlock),
                toBlock: ethers.utils.hexValue(blockNumberIndex),
            });

            console.log("BLOCK: ", blockNumberIndex, " NUMBER OF LOGS: ", tempLogs.length);

            logs.push(...tempLogs);
            blockNumberIndex = fromBlock - 1;
        };

        const formattedEvents = logs.map(log => {

            const decodedEvent = iface.decodeEventLog("PairCreated", log.data);
            return {
                pairAddress: decodedEvent.pair,
                token0: ethers.utils.getAddress(ethers.utils.hexStripZeros(log.topics[1])),
                token1: ethers.utils.getAddress(ethers.utils.hexStripZeros(log.topics[2]))
            };
        });

        // console.log("Formatted events:", formattedEvents);

        return formattedEvents;
    } catch (error) {
        logError("Error occurred:", error);
    }
};

const main = async () => {
    try {
        const pairData = await eventFilter5WithPagination();
        logDebug(`pairData:`, pairData);
    } catch (error) {
        logError("error", error)
    }
};

const mainn = async () => {
    try {
        const pairData = await eventFilter5WithPagination();
        for (const pair of pairData) {
            const pairAddress = pair.pairAddress;
            const isPairDataSaved = await checkPairExists(pairAddress);
            if (!isPairDataSaved) {
                logDebug(`Pair data already exists for`, pairAddress);
            }
        }
    } catch (error) {
        logError("error", error);
    }
};

// main();
// savePairDataWithFactoryInfo()
// eventFilterv5WithPagination();

// module.exports = { savePairDataWithFactoryInfo }