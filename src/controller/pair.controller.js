const ethers = require("ethers");
const factoryABI = require("../abi/factoryabi.json");
const { savePairData } = require('../services/common-services/pair-and-token-common.service');
const pairDbService = require("../services/database-services/pair-db.service");
const { logError, logDebug } = require("../services/common-services/log-common.service");
const { saveAllPairDataFromPairAddresses } = require("../services/common-services/pair-common.service");
const { getSupplyPairAddress } = require("../services/contract-services/pair-account-contract.service");
const { DECIMALS } = require("../config/constant.config");

const listenForPairCreateInfo = async () => {
    const url = process.env.VINOTHIUM_URL;
    const contractAddress = process.env.VINOTHIUM_CONTRACT_ADDRESS;
    const provider = new ethers.providers.JsonRpcProvider(url);
    const contract = new ethers.Contract(contractAddress, factoryABI, provider);

    contract.on("PairCreated", async (pairAddress, token0Address, token1Address, event) => {
        let pairData = {
            pairAddress: pairAddress,
            tokenAddress0: token0Address,
            tokenAddress1: token1Address,
            pairRank: +(event._hex)
        };
        await savePairData(pairData);

    })
};

const savePairDataFromPairAddress = async (req, res) => {
    try {
        let savedPairAddress = {}
        const pairAddresses = req.body.pairAddresses;

        savedPairAddress = await saveAllPairDataFromPairAddresses(pairAddresses);
        res.status(200).json({
            success: true,
            message: "Pair Data Saved Successfully.",
            data: savedPairAddress
        });
    } catch (error) {
        logError("Error in savePairDataFromPairAddress() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const getLPPriceFromPairAddress = async (req, res) => {
    try {
        const pairAddress = req.body.pairAddress;

        const totalSupply = await getSupplyPairAddress(pairAddress);

        const { reserveUSD } = await pairDbService.getPairReserveInfo(pairAddress);

        const totalSupplyDecimal = (BigInt(totalSupply._hex));

        const totalLiquidityUSD = BigInt(reserveUSD * (10 ** DECIMALS));

        const LPPrice = Number(totalLiquidityUSD) / Number(totalSupplyDecimal);

        res.status(200).json({
            success: true,
            message: "LP Price Fetch Successfully.",
            data: { pairAddress, totalSupply: totalSupplyDecimal.toString(), totalLiquidityUSD: totalLiquidityUSD.toString(), LPPrice }
        });
    } catch (error) {
        logError("Error in getLPPriceFromPairAddress() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// const listenForBlockWiseTransactionHash = async () => {

//     const url = process.env.VINOTHIUM_URL;
//     const contractAddress = process.env.VINOTHIUM_CONTRACT_ADDRESS;
//     const provider = new ethers.providers.JsonRpcProvider(url);
//     const contract = new ethers.Contract(contractAddress, factoryABI, provider);

//     const eventFilter = contract.filters['PairCreated'];
//     const fromBlock = 19839729;
//     const toBlock = 19839732;
//     const eventLogs = await contract.queryFilter(eventFilter, fromBlock, toBlock);

//     eventLogs.forEach((log) => {
//         console.log(`Block number: ${log.blockNumber}`);
//         console.log(`Transaction hash: ${log.transactionHash}`);
//         // console.log(`Event name: ${log.event}`);
//         // console.log(`Event arguments: ${JSON.stringify(log.args)}`);
//     });
// }

// const saveUSDCPairCreation = async () => {
//     const url = process.env.VINOTHIUM_URL;
//     const contractAddress = process.env.VINOTHIUM_CONTRACT_ADDRESS;
//     const provider = new ethers.providers.JsonRpcProvider(url);
//     const contract = new ethers.Contract(contractAddress, factoryABI, provider);

//     contract.on("PairCreated", async (pairAddress, token0Address, token1Address, event) => {
//         let pairCreatedEvent = {
//             from: pairAddress,
//             to: token0Address,
//             value: token1Address,
//             eventData: event
//         };
//         console.log("pairCreatedEvent", pairCreatedEvent);
//         try {
//             await pairService.savePairInfo(pairCreatedEvent);
//         } catch (error) {
//             logError("Error handling PairCreated event:", error);
//         }
//     });
// };

const findAllPairDetailsInfo = async (req, res) => {
    try {
        const pairDetails = await pairDbService.findAllPairDetails();
        if (pairDetails.length > 0) {
            const pairDetailsWithIcon = pairDetails.map(pair => {
                const pairWithIcon = { ...pair };

                if (pair.tokenIcon0) {
                    pairWithIcon.tokenIcon0 = `${req.baseURL}${pair.tokenIcon0}`;
                }

                if (pair.tokenIcon1) {
                    pairWithIcon.tokenIcon1 = `${req.baseURL}${pair.tokenIcon1}`;
                }

                return pairWithIcon;
            });
            res.status(200).json({
                success: true,
                message: "Pair list has been fetched Successfully.",
                data: pairDetailsWithIcon
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No pairs found for the token.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findAllPairDetailsInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findByPairAddressFromPairDetails = async (req, res) => {
    const pairAddress = req.params.pairAddress
    try {
        const pairDetails = await pairDbService.getPairDetailsByPairAddress(pairAddress);
        if (pairDetails) {

            if (pairDetails.tokenIcon0) {
                pairDetails.tokenIcon0 = `${req.baseURL}${pairDetails.tokenIcon0}`;
            }
            if (pairDetails.tokenIcon1) {
                pairDetails.tokenIcon1 = `${req.baseURL}${pairDetails.tokenIcon1}`;
            }

            res.status(200).json({
                success: true,
                message: "Pair list has been fetched Successfully.",
                data: pairDetails
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No pairs found for the token.",
                data: {}
            });
        }
    } catch (error) {
        logError("Error in findByPairAddressFromPairDetails() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findTransactionsByPairAddressInfo = async (req, res) => {
    const actionType = req.body.actionType ?? '';
    const pairAddress = req.params.pairAddress;
    const tokenAddress = '';
    const accountAddress = '';
    try {
        let transactions;
        if (actionType) {
            transactions = await pairDbService.findTransactionsByPairAddress(actionType, pairAddress, tokenAddress, accountAddress);
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid actionType provided."
            });
        };
        if (transactions && transactions.length > 0) {
            res.status(200).json({
                success: true,
                message: "transaction details fetched successfully",
                data: transactions
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No transactions found for the Pair address.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findTransactionsByTokenAddressInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findChartByPairAddressInfo = async (req, res) => {
    try {
        const periodTime = 1
        const pairAddress = req.params.pairAddress ?? '';
        const periodType = req.body.periodType
        const pairChartDetails = await pairDbService.findChartsByPairAddress(pairAddress, periodType, periodTime);
        if (pairChartDetails.length > 0) {
            res.status(200).json({
                success: true,
                message: "Token Chart Data fetched successfully",
                data: pairChartDetails
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No Chart Data found for the pairAddress.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findChartByPairAddressInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const findPairHourlyChartByPairAddressInfo = async (req, res) => {
    try {
        const periodTime = 1
        const pairAddress = req.params.pairAddress ?? '';
        const periodType = req.body.periodType
        const pairHourlyChartData = await pairDbService.findPairHourlyChartByPairAddress(pairAddress, periodType, periodTime);
        if (pairHourlyChartData.length > 0) {
            res.status(200).json({
                success: true,
                message: "Pair Hourly Chart Data fetched successfully",
                data: pairHourlyChartData
            });
        } else {
            res.status(200).json({
                success: true,
                message: "No Pair Hourly Chart Data found for the pairAddress.",
                data: []
            });
        }
    } catch (error) {
        logError("Error in findPairHourlyChartByPairAddressInfo() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// savePairData();
// savePairDataWithFactoryInfo();
// listenForPairCreateInfo();
// saveUSDCPairCreation();

module.exports = {
    listenForPairCreateInfo,
    findAllPairDetailsInfo,
    findByPairAddressFromPairDetails,
    findTransactionsByPairAddressInfo,
    findChartByPairAddressInfo,
    findPairHourlyChartByPairAddressInfo,
    savePairDataFromPairAddress,
    getLPPriceFromPairAddress
}