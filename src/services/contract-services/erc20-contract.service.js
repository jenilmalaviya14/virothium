const ethers = require("ethers");
const erc20ABI = require("../../abi/erc20.abi.json");
const { logError } = require("../common-services/log-common.service");

const getTokenInfoFromContract = async (tokenAddress) => {
    try {
        const providerUrl = process.env.VINOTHIUM_URL;
        const provider = new ethers.providers.JsonRpcProvider(providerUrl);
        const tokenContract = new ethers.Contract(tokenAddress, erc20ABI, provider);

        let tokenName = 'unknown';
        let tokenSymbol = 'unknown';
        let tokenDecimals = 0;

        [tokenName, tokenSymbol, tokenDecimals] = await Promise.all([
            tokenContract.name().catch(error => {
                logError("Error getting token name:", error.message);
                return tokenName;
            }),
            tokenContract.symbol().catch(error => {
                logError("Error getting token symbol:", error.message);
                return tokenSymbol;
            }),
            tokenContract.decimals().catch(error => {
                logError("Error getting token decimals:", error.message);
                return tokenDecimals;
            })
        ]);

        if (tokenDecimals == 0) {
            tokenDecimals = 1
        }

        // console.log("tokenName:", tokenName);
        // console.log("tokenSymbol:", tokenSymbol);

        return {
            tokenName,
            tokenSymbol,
            tokenDecimals
        };
    } catch (error) {
        logError("Error in getTokenInfoFromContract() function:", error.message);
        throw error;
    }
};

module.exports = { getTokenInfoFromContract };
