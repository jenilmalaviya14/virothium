const accountDbService = require("../database-services/account-db.service");
const { logError, logDebug } = require("./log-common.service");

const updateAccountData = async (accountData) => {
    try {
        for (let data of accountData) {
            const { pairAddress, accountconversationRatio, actionType } = data;
            console.log("updateAccountData", data);
            // if (actionType.toLowerCase() == 'mint' || actionType.toLowerCase() == 'burn') {

            let accountVolumeToken0 = 0
            let accountVolumeToken1 = 0
            let accountVolumeUSD = 0

            const pairData = await accountDbService.fetchPairData(pairAddress);

            logDebug("pairDataaaa", pairData);
            if (pairData) {
                accountVolumeToken0 = pairData.volumeToken0 * accountconversationRatio;
                accountVolumeToken1 = pairData.volumeToken1 * accountconversationRatio;
                accountVolumeUSD = pairData.volumeUSD * accountconversationRatio;
            }
            const accountDataInfo = {
                ...data,
                accountVolumeToken0,
                accountVolumeToken1,
                accountVolumeUSD
            }
            await accountDbService.saveOrUpdateAccountInfo(accountDataInfo);
            // }
        }
        return true;
    } catch (error) {
        logError("Error in updateAccountData() function:", error);
        return false;
    }
};

module.exports = { updateAccountData }