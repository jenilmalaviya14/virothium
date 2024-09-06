const pairABI = require("../../abi/pair.abi.json");
const ethers = require("ethers");
const { logError } = require("../common-services/log-common.service");

const getTokenAddressesFromPair = async (pairAddress) => {
    try {
        const providerUrl = process.env.VINOTHIUM_URL;
        const provider = new ethers.providers.JsonRpcProvider(providerUrl);
        const pairContract = new ethers.Contract(pairAddress, pairABI, provider);
        const [token0, token1] = await Promise.all([
            pairContract.token0(),
            pairContract.token1()
        ]);
        return { token0, token1 };
    } catch (error) {
        logError("Error in getTokenAddressesFromPair() function:", error);
    }
};

module.exports = { getTokenAddressesFromPair }