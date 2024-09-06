const { getPairAddressFromWhiteListTokenAddress } = require("../database-services/white-list-token-db.service");
const { logError, logDebug } = require("./log-common.service");

const checkInWhiteListToken = (whiteListTokens, tokenAddress) => {
    try {
        const tokenFound = whiteListTokens.find(x => x.tokenAddress.toLowerCase() === tokenAddress.toLowerCase());
        if (tokenFound) {
            return {
                whiteListExists: true,
                dynamicRate: tokenFound.dynamicRate == 1,
                dynamicTokenName: tokenFound.dynamicTokenName
            }
        } else {
            return {
                whiteListExists: false,
                dynamicRate: false,
                dynamicTokenName: ''
            }
        }
    } catch (error) {
        throw error;
    }
};

const findTokenWhiteListPair = async (tokenAddress) => {
    try {
        const pairAddress = await getPairAddressFromWhiteListTokenAddress(tokenAddress);
        logDebug(`pairAddress `, pairAddress);
        return pairAddress

    } catch (error) {
        logError("Error in findTokenWhiteListPair() function:", error);
        throw error;
    };
};

module.exports = {
    checkInWhiteListToken,
    findTokenWhiteListPair
}