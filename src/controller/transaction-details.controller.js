const ethers = require("ethers");
const routerABI = require("../abi/router.abi.json");
const { getAndCalcTransactionDetailsFromTransactionHash, getProviderAndTransactions } = require('../services/common-services/transaction-details-common.service');
const { saveTransactionQueueInfo } = require('../services/database-services/transaction-queue-db.service');
const { logError, logDebug } = require('../services/common-services/log-common.service');

const transactionHashes = []

const listenForTransactionInfo = async () => {
    const url = process.env.VINOTHIUM_URL;
    const provider = new ethers.providers.JsonRpcProvider(url);
    const routerAddress = process.env.ROUTER_ADDRESS;
    const contract = new ethers.Contract(routerAddress, routerABI, provider);
    contract.on("executeOperation", async (event) => {
        // logDebug("listenForTransactionInfo event", event);
        const transactionHash = event.transactionHash;
        logDebug("listenForTransactionInfo transactionHash", transactionHash);
        let transactionData = [transactionHash];
        logDebug("listenForTransactionInfo transactionData", transactionData);
        await saveTransactionQueueInfo(transactionData);
    });
};

const getAndUpdateTransactionDetailsFromTransactionHash = async () => {
    try {
        await getAndCalcTransactionDetailsFromTransactionHash(transactionHashes)
    } catch (error) {
        logError("Error in getAndUpdateTransactionDetailsFromTransactionHash() function:", error);
    }
};

const saveTransactionHashInQueue = async (req, res) => {
    try {
        let transactionHashQueue = []
        const transactionHashes = req.body.transactionHashes
        transactionHashQueue = await saveTransactionQueueInfo(transactionHashes);
        res.status(200).json({
            success: true,
            message: "All Data Saved Successfully.",
            data: transactionHashQueue
        });
    } catch (error) {
        logError("Error in saveTransactionHashInQueue() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const transactionHashTest = async (req, res) => {
    try {
        const transactionHash = req.body.transactionHash
        const data = await getProviderAndTransactions(transactionHash);
        res.status(200).json({
            success: true,
            message: "All Data Saved Successfully.",
            data: data.transaction
        });
    } catch (error) {
        logError("Error in transactionHashTest() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = {
    listenForTransactionInfo,
    saveTransactionHashInQueue,
    transactionHashTest
};