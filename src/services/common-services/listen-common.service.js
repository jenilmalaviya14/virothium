const { startTransactionQueueProcess } = require("../common-services/transaction-queue-common.service");
const { listenForPairCreateInfo } = require("../../controller/pair.controller");
const { listenForTransactionInfo } = require("../../controller/transaction-details.controller");
const { logError } = require('./log-common.service')

const startListen = async () => {
    try {
        // await listenForPairCreateInfo();
        await listenForTransactionInfo();
        await startTransactionQueueProcess();
    } catch (error) {
        logError("Error in startListen() function:", error);
    }
}

const temp = async () => {
    const reserveDataWithoutHex = "0000000000000000000000000000000000000000000004cdf786fe8f16e425c000000000000000000000000000000000000000000000000000004061532f0b66";
    console.log("reserveDataWithoutHex in Swap", reserveDataWithoutHex)
    const bigReserve0 = BigInt('0x' + reserveDataWithoutHex.slice(0, 64));
    console.log(`bigReserve0 in Swap: `, bigReserve0);
    const bigReserve1 = BigInt('0x' + reserveDataWithoutHex.slice(64, 128));
    console.log(`bigReserve1 in Swap: `, bigReserve1);
}

// temp()
startListen();

// module.exports = { startListen }