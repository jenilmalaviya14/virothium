const { executeQuery } = require('../../db/db-query');
const { insertTransactionQueue } = require('./transaction-queue-db.service');
const { logError, logDebug } = require('../common-services/log-common.service');
const { replaceUnwantedChar } = require('./utility.service');

// const insertTransactionInfo = async (transactionData) => {
//     try {
//         const sql = `INSERT INTO transaction_details (transactionHash, sender, receiver, pairAddress, amount0In, amount1In, amount0Out, amount1Out, transactionDatetime, logIndex, createdOn, updatedOn)
//     VALUES ('${transactionData.transactionHash}', '${transactionData.sender}', '${transactionData.receiver}', '${transactionData.pairAddress}', ${transactionData.amount0In}, ${transactionData.amount1In}, ${transactionData.amount0Out}, ${transactionData.amount1Out}, '${transactionData.transactionDatetime}', ${transactionData.logIndex}, UTC_TIMESTAMP(), UTC_TIMESTAMP())`;
//         await db.execute(sql);
//         console.log("Transaction Details saved to database");
//     } catch (error) {
//         logError("Error in insertTransactionInfo() function:", error);
//     }
// };

const insertTransactionInfo = async (transactionData) => {
    try {
        const values = transactionData.map(data => `(
            '${data.transactionHash}',
            '${data.sender}',
            '${data.receiver}',
            '${data.transactionFrom}',
            '${data.pairAddress}',
            '${data.accountAddress}',
            '${data.totalAmount0 ?? 0}',
            '${data.totalAmount1 ?? 0}',
            '${data.amount0In ?? 0}',
            '${data.amount1In ?? 0}',
            '${data.amount0Out ?? 0}',
            '${data.amount1Out ?? 0}',
            '${data.transactionDatetime}',
            '${data.blockTimeStamp}',
            ${data.logIndex},
            ${data.blockNumber},
            '${data.transactionType}',
            ${data.exchangeRateUSD ?? 0},
            ${data.conversaionRatio ?? 0},
            ${data.priceUSD ?? 0},
            ${data.priceUSDToken0 ?? 0},
            ${data.priceUSDToken1 ?? 0},
            ${(data.actionType.toLowerCase() !== 'swap' ? data.totalUSD * 2 : data.totalUSD) ?? 0},
            '${data.actionType}',
            '${replaceUnwantedChar(data.transactionDescription)}',
            UTC_TIMESTAMP(),
            UTC_TIMESTAMP()
        )`).join(', ');

        const sql = `INSERT INTO transaction_details (
            transactionHash,
            sender,
            receiver,
            transactionFrom,
            pairAddress,
            accountAddress,
            totalAmount0,
            totalAmount1,
            amount0In,
            amount1In,
            amount0Out,
            amount1Out,
            transactionDatetime,
            blockTimeStamp,
            logIndex,
            blockNumber,
            transactionType,
            exchangeRate,
            conversaionRatio,
            priceUSD,
            priceUSDToken0,
            priceUSDToken1,
            totalUSD,
            actionType,
            transactionDescription,
            createdOn,
            updatedOn
        ) VALUES ${values}`;

        await executeQuery(sql);
        logDebug("Transaction Details saved to database");
        return true
    } catch (error) {
        logError("Error in insertTransactionInfo() function:", error);
        return false;
    }
};

const saveTransactionInfo = async (transactionData) => {
    try {
        const transactionExists = await checkTransactionExists(transactionData[0].transactionHash);
        if (transactionExists) {
            return true;
        }
        const insertResult = await insertTransactionInfo(transactionData);
        return insertResult;
    } catch (error) {
        logError("Error in saveTransactionInfo() function:", error);
        return false;
    }
};

const checkTransactionExists = async (transactionHash) => {
    try {
        const sql = `SELECT * FROM transaction_details WHERE transactionHash = '${transactionHash}'`;
        const results = await executeQuery(sql);
        if (results) {
            const [[existingTransaction]] = results;
            return existingTransaction;
        }
        return null;
    } catch (error) {
        logError("Error in checkTransactionExists() function:", error);
    }
};

module.exports = { insertTransactionInfo, saveTransactionInfo, checkTransactionExists }