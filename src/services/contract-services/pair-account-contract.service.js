const pairABI = require("../../abi/pair.abi.json");
const ethers = require("ethers");
const { logError, logDebug } = require("../common-services/log-common.service");

const getSupplyAndBalanceFromAccountAddress = async (pairAddress, accountAddress) => {
    try {
        const providerUrl = process.env.VINOTHIUM_URL;
        const provider = new ethers.providers.JsonRpcProvider(providerUrl);
        const pairContract = new ethers.Contract(pairAddress, pairABI, provider);
        logDebug("contract for accountAddress", accountAddress);
        const [totalSupply, balanceOf] = await Promise.all([
            pairContract.totalSupply(),
            pairContract.balanceOf(accountAddress)
        ]);
        logDebug("contract for totalSupply.", totalSupply);
        logDebug("contract for balanceOf", balanceOf);
        return { balanceOf, totalSupply };
    } catch (error) {
        logError("Error in getSupplyAndBalanceFromAccountAddress() function:", error);
        throw error;
    }
};

const getSupplyPairAddress = async (pairAddress) => {
    try {
        const providerUrl = process.env.VINOTHIUM_URL;
        const provider = new ethers.providers.JsonRpcProvider(providerUrl);
        const pairContract = new ethers.Contract(pairAddress, pairABI, provider);
        const totalSupply = await pairContract.totalSupply();
        logDebug("contract for totalSupply.", totalSupply);
        return totalSupply;
    } catch (error) {
        logError("Error in getSupplyPairAddress() function:", error);
        throw error;
    }
};

module.exports = { getSupplyAndBalanceFromAccountAddress, getSupplyPairAddress };
