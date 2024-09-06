const ethers = require("ethers");
const routerABI = require("../../abi/router.abi.json")
const { getTransactionHashQueueList, insertOrUpdateTransactionQueueForFail, saveTransactionQueueInfo } = require('../database-services/transaction-queue-db.service');
const { getGeneralSettings, updateLastSyncBlockNumberInfo } = require('../database-services/general-setting-db.service');
const { getTransactionQueueCountAndSeconds } = require('../database-services/general-setting-db.service');
const { getAndCalcTransactionDetailsFromTransactionQueueHash } = require('./transaction-details-common.service');
const { logError, logDebug } = require('./log-common.service');
const sleep = require('sleep-promise')

const startTransactionQueueProcess = async () => {
    try {
        const queueSettings = await getTransactionQueueCountAndSeconds();
        if (queueSettings && queueSettings.queueProcessCount > 0) {
            logDebug("startTransactionQueueProcess");
            const queueWaitMiliSeconds = queueSettings.queueWaitSeconds * 1000
            let isQueueProcessed = false
            while (!isQueueProcessed) {
                // console.log("isQueueProcessed", new Date());

                const transactionHashes = await getTransactionHashQueueList(queueSettings.queueProcessCount);
                await getAndCalcTransactionDetailsFromTransactionQueueHash(transactionHashes);

                await sleep(queueWaitMiliSeconds);
            }
        }
    } catch (error) {
        logError("Error in startTransactionQueueProcess() function:", error);
    }
};

const listenForTransactionBlockWiseTransactionHash = async () => {
    try {

        logDebug("listenForTransactionBlockWiseTransactionHash Started");

        await insertOrUpdateTransactionQueueForFail()
        const generalSettings = await getGeneralSettings()

        let startingBlockNumber = generalSettings.lastSyncBlockNumber ?? 0;
        // const secondsAgo = (generalSettings.fetchMinutesAgoBlock ?? 0) * 60; // 5 = days (7200 minutes)
        const maxBlockOffset = generalSettings.maxBlockOffset ?? 0;
        // const platFormAverageBlockSeconds = generalSettings.platFormAverageBlockSeconds ?? 0 // general settings

        // logDebug("listenForTransactionBlockWiseTransactionHash secondsAgo", secondsAgo)
        logDebug("listenForTransactionBlockWiseTransactionHash maxBlockOffset", maxBlockOffset)
        // logDebug("listenForTransactionBlockWiseTransactionHash platFormAverageBlockSeconds", platFormAverageBlockSeconds)

        if (startingBlockNumber > 0 && maxBlockOffset > 0) {
            logDebug("Start Processing of listenForTransactionBlockWiseTransactionHash");

            const url = process.env.VINOTHIUM_URL;
            const routerAddress = process.env.ROUTER_ADDRESS;
            const provider = new ethers.providers.JsonRpcProvider(url);
            const contract = new ethers.Contract(routerAddress, routerABI, provider);

            // console.log(provider);

            const latestBlockNumber = await provider.getBlockNumber();
            logDebug("listenForTransactionBlockWiseTransactionHash latestBlockNumber", latestBlockNumber)

            // const blockDiff = secondsAgo / platFormAverageBlockSeconds
            // const startingBlockNumber = Math.floor(latestBlockNumber - blockDiff)
            // logDebug("listenForTransactionBlockWiseTransactionHash startingBlockNumber", startingBlockNumber);

            startingBlockNumber += 1;
            logDebug("listenForTransactionBlockWiseTransactionHash startingBlockNumber", startingBlockNumber)

            const processingBlocks = Math.ceil((latestBlockNumber - startingBlockNumber) / maxBlockOffset)
            logDebug("listenForTransactionBlockWiseTransactionHash processingBlocks", processingBlocks)

            for (let blockNumber = 0; blockNumber < processingBlocks; blockNumber++) {
                let fromBlock = startingBlockNumber + (blockNumber * maxBlockOffset)
                let toBlock = fromBlock + maxBlockOffset;
                if (blockNumber > 0) {
                    fromBlock++
                }
                if (toBlock > latestBlockNumber) {
                    toBlock = latestBlockNumber
                }
                logDebug("listenForTransactionBlockWiseTransactionHash fromBlock", fromBlock);
                logDebug("listenForTransactionBlockWiseTransactionHash toBlock", toBlock);

                await getAndUpdateTransactionHashFromBlockNumber(contract, fromBlock, toBlock)
            }
        }
    } catch (error) {
        logError("listenForTransactionBlockWiseTransactionHash Error:", error)
    }
    logDebug("listenForTransactionBlockWiseTransactionHash Ended");
};

const getAndUpdateTransactionHashFromBlockNumber = async (contract, fromBlock, toBlock) => {
    try {
        const eventFilter = contract.filters['executeOperation'];

        const eventLogs = await contract.queryFilter(eventFilter, fromBlock, toBlock);

        const transactionHashes = eventLogs.map((log) => log.transactionHash)

        logDebug(transactionHashes)
        await saveTransactionQueueInfo(transactionHashes);

        await updateLastSyncBlockNumberInfo(toBlock);
    } catch (error) {
        logError("getAndUpdateTransactionHashFromBlockNumber Error:", error)
    }
}

// startTransactionQueueProcess();

module.exports = {
    startTransactionQueueProcess,
    listenForTransactionBlockWiseTransactionHash
}