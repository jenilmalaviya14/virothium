const routerABI = require("../../abi/router.abi.json");
const ethers = require("ethers");
const { logError, logDebug } = require("../common-services/log-common.service");

const findAmountsOut = async (amountIn, path) => {
    try {
        const providerUrl = process.env.VINOTHIUM_URL;
        const provider = new ethers.providers.JsonRpcProvider(providerUrl);
        const routerAddress = process.env.ROUTER_ADDRESS;
        const routerContract = new ethers.Contract(routerAddress, routerABI, provider);

        const amountsOut = await routerContract.getAmountsOut(amountIn, path);
        logDebug(`amountsOut: `, amountsOut);
        if (amountsOut) {
            const extractedIntegers = amountsOut[1].toString();
            // console.log("extractedIntegers", extractedIntegers);
            return extractedIntegers
        }

        return 0;
    } catch (error) {
        logError("Error in findAmountsOut() function:", error);
        return 0;
    }
};
module.exports = { findAmountsOut }