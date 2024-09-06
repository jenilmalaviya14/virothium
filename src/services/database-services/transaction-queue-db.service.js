const { executeQuery } = require('../../db/db-query');
const { logError, logDebug } = require('../common-services/log-common.service');

const saveTransactionQueueInfo = async (transactionHashes) => {
    try {
        logDebug("transactionHashes in transactionQueue", transactionHashes);
        const transactionHashQueue = `'${transactionHashes.join(`', '`)}'`;
        logDebug("transactionHashQueue in transactionQueue", transactionHashQueue);
        let transactionQueueExists = await checkTransactionQueueExists(transactionHashQueue);
        logDebug("transactionHashQueueExists", transactionQueueExists);
        transactionQueueExists = transactionQueueExists.flatMap(x => x.transactionHash);

        logDebug("saveTransactionQueueInfo transactionQueueExists", transactionQueueExists)

        const transactionHashQueueExists = new Set(transactionQueueExists);

        const transactionHashPendingQueue = transactionHashes.filter(item =>
            !transactionHashQueueExists.has(item)
        );

        if (transactionHashPendingQueue.length > 0) {
            await insertTransactionQueue(transactionHashPendingQueue)
        }

        return transactionHashPendingQueue
    } catch (error) {
        logError("Error in saveTransactionQueueInfo() function:", error);
    }
}

const insertTransactionQueue = async (transactionHashes) => {
    try {
        logDebug("insertTransactionQueue transactionHashes", transactionHashes);
        const values = transactionHashes.map(transactionHash => `(
            '${transactionHash}',
            'pending',
            UTC_TIMESTAMP()
        )`).join(', ');
        const sql = `INSERT INTO transaction_queue (transactionHash, status, createdOn) VALUES ${values}`;
        await executeQuery(sql);
        logDebug("Transaction Queue saved to database");
    } catch (error) {
        logError("Error in insertTransactionQueue() function:", error);
    }
};

const checkTransactionQueueExists = async (transactionHash) => {
    try {
        const sql = `SELECT transactionHash FROM transaction_queue WHERE transactionHash IN (${transactionHash})`;
        const results = await executeQuery(sql);
        if (results) {
            const [existingTransactionQueue] = results;
            return existingTransactionQueue;
        }
        return null;
    } catch (error) {
        logError("Error in checkTransactionQueueExists() function:", error);

    }
};

const updateTransactionQueueForRunning = async (transactionHash) => {
    try {
        let sql = `
            UPDATE transaction_queue
            SET status = 'running',
                startedOn = UTC_TIMESTAMP()
            WHERE transactionHash = '${transactionHash}'`;
        await executeQuery(sql);
        logDebug(`TransactionQueue status updated to 'running' `, transactionHash);
    } catch (error) {
        logError("Error in updateTransactionQueueForRunning() function:", error);
    }
};

const updateTransactionQueueForSuccess = async (transactionHash) => {
    try {
        const sql = `
            UPDATE transaction_queue
            SET status = 'success',
                errorMessage = '',
                endedOn = UTC_TIMESTAMP()
            WHERE transactionHash = '${transactionHash}'`;
        await executeQuery(sql);
        logDebug(`TransactionQueue status updated to 'success' `, transactionHash);
    } catch (error) {
        logError("Error in updateTransactionQueueForSuccess() function:", error);
    }
};

const updateTransactionQueueForFail = async (transactionHash, errorMessage) => {
    try {
        const sql = `
            UPDATE transaction_queue
            SET status = 'fail',
                errorMessage = '${errorMessage}',
                endedOn = UTC_TIMESTAMP(),
                failedCount = failedCount + 1
            WHERE transactionHash = '${transactionHash}'`;
        await executeQuery(sql);
        logDebug(`TransactionQueue status updated to 'fail' `, transactionHash);
    } catch (error) {
        logError("Error in updateTransactionQueueForFail() function:", error);
    }
};

const insertOrUpdateTransactionQueueForFail = async () => {
    try {
        const sql = `
            UPDATE transaction_queue
            SET status = 'pending',
                errorMessage = '',
                recreatedOn = UTC_TIMESTAMP()
            WHERE status = 'fail' AND failedCount <= 5`;
        await executeQuery(sql);
    } catch (error) {
        logError("Error in insertOrUpdateTransactionQueue() function:", error);
    }
};

const getTransactionHashQueueList = async (queueProcessCount) => {
    try {
        queueProcessCount = queueProcessCount <= 0 ? 1 : queueProcessCount
        const sql = `SELECT transactionHash FROM transaction_queue WHERE status <> 'success' AND status <> 'fail' ORDER BY createdOn LIMIT ${queueProcessCount}`;
        const results = await executeQuery(sql);
        if (results) {
            const [transactionQueueList] = results;
            const transactionHashes = transactionQueueList.flatMap(x => x.transactionHash);
            return transactionHashes;
        }
        return null;
    } catch (error) {
        logError("Error in getTransactionHashQueueList() function:", error);
    }
}

module.exports = {
    saveTransactionQueueInfo,
    updateTransactionQueueForRunning,
    updateTransactionQueueForSuccess,
    getTransactionHashQueueList,
    updateTransactionQueueForFail,
    insertOrUpdateTransactionQueueForFail
}