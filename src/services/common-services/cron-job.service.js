
const cron = require('node-cron');
const { listenForTransactionBlockWiseTransactionHash } = require("./transaction-queue-common.service");

cron.schedule('0 */1 * * *', listenForTransactionBlockWiseTransactionHash, {
    scheduled: true,
    timezone: 'UTC'
});