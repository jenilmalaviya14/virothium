const ethers = require("ethers");
const factoryABI = require("../../abi/factoryabi.json");
const { logError } = require("../common-services/log-common.service");

const getFactoryInfoFromContract = async (factoryAddress) => {
    try {
        const providerUrl = process.env.VINOTHIUM_URL;
        const provider = new ethers.providers.JsonRpcProvider(providerUrl);
        const factoryContract = new ethers.Contract(factoryAddress, factoryABI, provider);

        const totalPairs = await factoryContract.allPairsLength();

        return {
            totalPairs,
            getPair: async (index) => {
                return await factoryContract.allPairs(index);
            }
        };
    } catch (error) {
        logError("Error in getFactoryInfoFromContract() function:", error);
    }
};

const getFeeAddressFromContract = async (factoryAddress) => {
    try {
        const providerUrl = process.env.VINOTHIUM_URL;
        const provider = new ethers.providers.JsonRpcProvider(providerUrl);
        const factoryContract = new ethers.Contract(factoryAddress, factoryABI, provider);

        const feeToAddress = await factoryContract.feeTo();

        return feeToAddress
    } catch (error) {
        logError("Error in getFeeAddressFromContract() function:", error);
    }
};

module.exports = { getFactoryInfoFromContract, getFeeAddressFromContract }