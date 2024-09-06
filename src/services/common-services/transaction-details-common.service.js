const ethers = require("ethers");
const { saveTransactionInfo } = require("../database-services/transaction-details.service");
const { checkPairExists } = require("../database-services/pair-db.service");
const { savePairDataFromPairAddress } = require('./pair-and-token-common.service');
const { checkTransactionExists } = require('../database-services/transaction-details.service');
const { getPairDetailsWithTokenInfo } = require('../database-services/pair-db.service');
const { updatePairData, updatePairHourlyData, updatePairDailyData } = require('./pair-common.service');
const { updateAccountData } = require('./account-common.service');
const { updateTokenData, updateTokenHourlyData, updateTokenDailyData } = require('./token-common.service');
const { findAmountsOut } = require('../contract-services/router-contract.service');
const { checkInWhiteListToken, findTokenWhiteListPair } = require('./white-list-common.service');
const { getActiveWhiteListToken } = require('../database-services/white-list-token-db.service');
const { updateTransactionQueueForRunning, updateTransactionQueueForSuccess, updateTransactionQueueForFail } = require('../database-services/transaction-queue-db.service');
const { convertBigAmountToSmallAmount, convertSmallAmountToBigAmount, getHourStartIndex, getStartUnix, getDayIndex, getDayStartTimeStamp, getExternalUSDRate, getNativeTokenUSDRate, getUTCDateTimeFromTimeStamp, compareExternalUSDRateWithNativeUSDRate, getExternalOrNativeUSDRate } = require("./utility-common.service");
const { logError, logDebug } = require('./log-common.service');
const { getSupplyAndBalanceFromAccountAddress } = require("../contract-services/pair-account-contract.service");
const { getFeeToAddress } = require("../database-services/general-setting-db.service");

// const calcTokenAddress = async (quoteTokenAmount, baseTokenAmount, quoteTokenwhiteList) => {
//     let transactionType = '';
//     let exchangeRateUSD = 1;
//     let conversaionRatio = 0;
//     let priceUSD = 0;
//     let totalUSD = 0;

//     transactionType = bigAmount1In > 0 ? 'Sell' : 'Buy';
//     if (quoteTokenwhiteList.dynamicRate) {
//         exchangeRateUSD = await getExternalUSDRate(quoteTokenwhiteList.dynamicTokenName);
//     }
//     conversaionRatio = quoteTokenAmount / baseTokenAmount;
//     priceUSD = conversaionRatio * exchangeRateUSD;
//     totalUSD = quoteTokenAmount * exchangeRateUSD;

//     return { transactionType, conversaionRatio, priceUSD, totalUSD };
// };

const getAndCalcTransactionDetailsFromTransactionHash = async (transactionHashes) => {
    try {
        for (let transactionHash of transactionHashes) {
            const isTransactionHashExists = await checkTransactionExists(transactionHash);
            if (!isTransactionHashExists) {
                const data = await getProviderAndTransactions(transactionHash)
                if (data && data.provider && data.transaction) {
                    await getAndCalcSwapDetailsFromTransactionHash(data.provider, data.transaction)
                    await getAndCalcMintDetailsFromTransactionHash(data.provider, data.transaction)
                    await getAndCalcBurnDetailsFromTransactionHash(data.provider, data.transaction)
                }
            }
        }
    } catch (error) {
        logError("Error in getAndCalcTransactionDetailsFromTransactionHash() function:", error);
    }
};

const getAndCalcTransactionDetailsFromTransactionQueueHash = async (transactionHashes) => {
    try {
        for (let transactionHash of transactionHashes) {
            logDebug("getAndCalcTransactionDetailsFromTransactionQueueHash transactionHash", transactionHash)
            const isTransactionHashExists = await checkTransactionExists(transactionHash);
            if (!isTransactionHashExists) {
                await updateTransactionQueueForRunning(transactionHash)
                const data = await getProviderAndTransactions(transactionHash)
                if (data && data.provider && data.transaction) {
                    const swapResult = await getAndCalcSwapDetailsFromTransactionHash(data.provider, data.transaction)
                    const mintResult = await getAndCalcMintDetailsFromTransactionHash(data.provider, data.transaction)
                    const burnResult = await getAndCalcBurnDetailsFromTransactionHash(data.provider, data.transaction)
                    logDebug("swapResult", swapResult);
                    logDebug("mintResult", mintResult);
                    logDebug("burnResult", burnResult);
                    if (swapResult.success && mintResult.success && burnResult.success) {
                        await updateTransactionQueueForSuccess(transactionHash)
                    } else {
                        let errorMessage = '';
                        errorMessage += !swapResult.success && swapResult.message ? ` Swap Error: ${swapResult.message}` : ''
                        errorMessage += !mintResult.success && mintResult.message ? ` Mint Error: ${mintResult.message}` : ''
                        errorMessage += !burnResult.success && burnResult.message ? ` Burn Error: ${burnResult.message}` : ''
                        if (errorMessage) {
                            await updateTransactionQueueForFail(transactionHash, errorMessage)
                        }
                    }
                } else {
                    await updateTransactionQueueForFail(transactionHash, 'error : provider or transaction not found.')
                }
            } else {
                await updateTransactionQueueForSuccess(transactionHash)
            }
        }
    } catch (error) {
        logError("Error in getAndCalcTransactionDetailsFromTransactionQueueHash() function:", error);
    }
};

const getProviderAndTransactions = async (transactionHash) => {
    logDebug(`transactionHash`, transactionHash);
    try {
        const url = process.env.VINOTHIUM_URL;
        const provider = ethers.getDefaultProvider(url);
        // logDebug(`provider:`, provider);
        const transaction = await provider.getTransactionReceipt(transactionHash);
        // logDebug("transaction", transaction);

        return { provider, transaction }
    } catch (error) {
        logError("Error in getProviderAndTransactions() function:", error);

    }
}

const getAndCalcSwapDetailsFromTransactionHash = async (provider, transaction) => {
    try {
        // const isTransactionHashExists = await checkTransactionExists(transactionHash);
        // if (!isTransactionHashExists) {
        // const url = process.env.VINOTHIUM_URL;
        const swapAddress = process.env.SWAP_ADDRESS
        const syncAddress = process.env.SYNC_ADDRESS
        // const provider = ethers.getDefaultProvider(url);
        // const transaction = await provider.getTransactionReceipt(transactionHash);

        const allSwaps = transaction.logs.filter(x => x.topics[0] === swapAddress);
        if (allSwaps.length > 0) {
            const allSync = transaction.logs.filter(x => x.topics[0] === syncAddress);

            const block = await provider.getBlock(transaction.blockNumber);
            const blockTimeStamp = block.timestamp * 1000;

            const hourIndex = getHourStartIndex(blockTimeStamp);
            const hourStartUnix = getStartUnix(blockTimeStamp);
            const dayIndex = getDayIndex(blockTimeStamp);
            const dayStartTimeStamp = getDayStartTimeStamp(blockTimeStamp);

            const hourStartDateTime = getUTCDateTimeFromTimeStamp(hourStartUnix);
            const dayStartDateTime = getUTCDateTimeFromTimeStamp(dayStartTimeStamp);

            const transactionDatetime = getUTCDateTimeFromTimeStamp(blockTimeStamp);

            const whiteListTokens = await getActiveWhiteListToken();

            const nativeTokenUSDRate = await getNativeTokenUSDRate();
            logDebug("getAndCalcSwapDetailsFromTransactionHash nativeTokenUSDRate", nativeTokenUSDRate);
            const nativeTokenRateFromUSD = 1 / nativeTokenUSDRate;

            const transactionData = []

            for (const swap of allSwaps) {

                let transactionType = '';
                let exchangeRateUSD = 1;
                let conversaionRatio = 0;
                let priceUSD = 0;
                let totalUSD = 0;
                let actionType = 'Swap';
                let reserve0 = 0;
                let reserve1 = 0;
                let reserveUSD = 0;

                const pairAddress = swap.address;

                const senderAddress = swap.topics.length >= 2 ? ethers.utils.getAddress(ethers.utils.hexStripZeros(swap.topics[1])) : null;
                const receiverAddress = swap.topics.length >= 3 ? ethers.utils.getAddress(ethers.utils.hexStripZeros(swap.topics[2])) : null;
                const accountAddress = receiverAddress;

                const { balanceOf, totalSupply } = await getSupplyAndBalanceFromAccountAddress(pairAddress, accountAddress);

                logDebug(`balanceOf in Swap: `, balanceOf);
                logDebug(`totalSupply in Swap: `, totalSupply);

                const totalSupplyHex = totalSupply._hex;
                const balanceOfHex = balanceOf._hex;

                logDebug(`totalSupplyHex in Swap: `, totalSupplyHex);
                logDebug(`balanceOfHex in Swap: `, balanceOfHex);

                const totalSupplyBigInt = BigInt(totalSupplyHex);
                const balanceOfBigInt = BigInt(balanceOfHex);

                logDebug(`totalSupplyBigInt in Swap: `, totalSupplyBigInt);
                logDebug(`balanceOfBigInt in Swap: `, balanceOfBigInt);

                const totalSupplyDecimal = Number(totalSupplyBigInt);
                const balanceOfDecimal = Number(balanceOfBigInt);

                logDebug(`totalSupplyDecimal in Swap: `, totalSupplyDecimal);
                logDebug(`balanceOfDecimal in Swap: `, balanceOfDecimal);

                const isPairExists = await checkPairExists(pairAddress);
                if (!isPairExists) {
                    await savePairDataFromPairAddress(pairAddress, -1);
                }
                const pairDetails = await getPairDetailsWithTokenInfo(pairAddress);

                logDebug(`pairDetails in Swap: `, pairDetails);

                const token0Decimals = pairDetails.token0Decimals;
                const token1Decimals = pairDetails.token1Decimals;

                console.log("token0Decimals in swap", token0Decimals);
                console.log("token1Decimals in swap", token1Decimals);

                const sync = allSync.find(x => x.address == pairAddress)
                if (sync) {
                    const reserveDataWithoutHex = sync.data.slice(2);
                    logDebug("reserveDataWithoutHex in Swap", reserveDataWithoutHex)
                    const bigReserve0 = BigInt('0x' + reserveDataWithoutHex.slice(0, 64));
                    logDebug(`bigReserve0 in Swap: `, bigReserve0);
                    const bigReserve1 = BigInt('0x' + reserveDataWithoutHex.slice(64, 128));
                    logDebug(`bigReserve1 in Swap: `, bigReserve1);

                    reserve0 = convertBigAmountToSmallAmount(bigReserve0, token0Decimals);
                    reserve1 = convertBigAmountToSmallAmount(bigReserve1, token1Decimals);

                    logDebug(`reserve0 in Swap: `, reserve0);
                    logDebug(`reserve1 in Swap: `, reserve1);
                };

                const token0whiteList = checkInWhiteListToken(whiteListTokens, pairDetails.tokenAddress0);
                const token1whiteList = checkInWhiteListToken(whiteListTokens, pairDetails.tokenAddress1);

                const dataWithoutHex = swap.data.slice(2);
                console.log("dataWithoutHex in swap", dataWithoutHex);
                const bigAmount0In = BigInt('0x' + dataWithoutHex.slice(0, 64));
                const bigAmount1In = BigInt('0x' + dataWithoutHex.slice(64, 128));
                const bigAmount0Out = BigInt('0x' + dataWithoutHex.slice(128, 192));
                const bigAmount1Out = BigInt('0x' + dataWithoutHex.slice(192, 256));

                logDebug("bigAmount0In in Swap", bigAmount0In);
                logDebug("bigAmount1In in Swap", bigAmount1In);
                logDebug("bigAmount0Out in Swap", bigAmount0Out);
                logDebug("bigAmount1Out in Swap", bigAmount1Out);

                let transactionDescription = ``;
                if (bigAmount0In > 0) {
                    transactionDescription = `Swap ${pairDetails.token0Symbol} for ${pairDetails.token1Symbol}`;
                } else if (bigAmount1In > 0) {
                    transactionDescription = `Swap ${pairDetails.token1Symbol} for ${pairDetails.token0Symbol}`;
                }

                const bigTotalAmount0 = bigAmount0In + bigAmount0Out;
                const bigTotalAmount1 = bigAmount1In + bigAmount1Out;

                // const totalAmount0 = (Number(bigTotalAmount0) / Number(BigInt(10 ** token0Decimals)));
                // const totalAmount1 = (Number(bigTotalAmount1) / Number(BigInt(10 ** token1Decimals)));
                const totalAmount0 = convertBigAmountToSmallAmount(bigTotalAmount0, token0Decimals)
                const totalAmount1 = convertBigAmountToSmallAmount(bigTotalAmount1, token1Decimals)

                const amount0In = convertBigAmountToSmallAmount(bigAmount0In, token0Decimals)
                const amount1In = convertBigAmountToSmallAmount(bigAmount1In, token1Decimals)
                const amount0Out = convertBigAmountToSmallAmount(bigAmount0Out, token0Decimals)
                const amount1Out = convertBigAmountToSmallAmount(bigAmount1Out, token1Decimals)

                logDebug("amount0In in Swap", amount0In);
                logDebug("amount1In in Swap", amount1In);
                logDebug("amount0Out in Swap", amount0Out);
                logDebug("amount1Out in Swap", amount1Out);

                if (token0whiteList.whiteListExists && token1whiteList.whiteListExists) { // token0 and token1 both in whitelist
                    if (!token0whiteList.dynamicRate) {
                        transactionType = bigAmount0In > 0 ? 'Sell' : 'Buy';
                        // conversaionRatio = totalAmount0 / totalAmount1;
                        // priceUSD = conversaionRatio * exchangeRateUSD;
                        totalUSD = totalAmount0 * exchangeRateUSD;
                        reserveUSD = reserve0 * exchangeRateUSD;

                    } else if (!token1whiteList.dynamicRate) {
                        transactionType = bigAmount1In > 0 ? 'Sell' : 'Buy';
                        // conversaionRatio = totalAmount1 / totalAmount0;
                        // priceUSD = conversaionRatio * exchangeRateUSD;
                        totalUSD = totalAmount1 * exchangeRateUSD;
                        reserveUSD = reserve1 * exchangeRateUSD;

                    } else {
                        transactionType = bigAmount1In > 0 ? 'Sell' : 'Buy';
                        if (token0whiteList.dynamicRate) {
                            exchangeRateUSD = await getExternalOrNativeUSDRate(token0whiteList.dynamicTokenName, nativeTokenUSDRate)
                        }
                        // conversaionRatio = totalAmount0 / totalAmount1;
                        // priceUSD = conversaionRatio * exchangeRateUSD;
                        totalUSD = totalAmount0 * exchangeRateUSD;
                        reserveUSD = reserve0 * exchangeRateUSD;
                    }
                } else if (token0whiteList.whiteListExists) { // token0 in whitelist
                    logDebug("token0 in whitelist");
                    transactionType = bigAmount1In > 0 ? 'Sell' : 'Buy';
                    if (token0whiteList.dynamicRate) {
                        exchangeRateUSD = await getExternalOrNativeUSDRate(token0whiteList.dynamicTokenName, nativeTokenUSDRate)
                    }
                    // conversaionRatio = totalAmount0 / totalAmount1;
                    // priceUSD = conversaionRatio * exchangeRateUSD;
                    totalUSD = totalAmount0 * exchangeRateUSD;
                    reserveUSD = reserve0 * exchangeRateUSD;
                } else if (token1whiteList.whiteListExists) { // token1 in whitelist
                    logDebug("token1 in whitelist");
                    transactionType = bigAmount0In > 0 ? 'Sell' : 'Buy';
                    if (token1whiteList.dynamicRate) {
                        exchangeRateUSD = await getExternalOrNativeUSDRate(token1whiteList.dynamicTokenName, nativeTokenUSDRate)
                    }
                    // conversaionRatio = totalAmount1 / totalAmount0;
                    // priceUSD = conversaionRatio * exchangeRateUSD;
                    totalUSD = totalAmount1 * exchangeRateUSD;
                    reserveUSD = reserve1 * exchangeRateUSD;
                } else { // token0 and token1 both are not in the white list
                    logDebug("token0 and token1 both are not in the white list");
                    const whiteListPairAddress0 = await findTokenWhiteListPair(pairDetails.tokenAddress0);
                    if (whiteListPairAddress0) {
                        exchangeRateUSD = await getUSDRateFromWhiteListPair(whiteListTokens, whiteListPairAddress0, nativeTokenUSDRate)

                        // conversaionRatio = totalAmount0 / totalAmount1;
                        // priceUSD = conversaionRatio * exchangeRateUSD;
                        // totalUSD = totalAmount0 * exchangeRateUSD;
                        transactionType = bigAmount1In > 0 ? 'Sell' : 'Buy';
                        // conversaionRatio = totalAmount0 / totalAmount1;
                        // priceUSD = conversaionRatio * exchangeRateUSD;
                        totalUSD = totalAmount0 * exchangeRateUSD;
                        reserveUSD = reserve0 * exchangeRateUSD;
                    }
                    if (totalUSD == 0) {
                        const whiteListPairAddress1 = await findTokenWhiteListPair(pairDetails.tokenAddress1);
                        if (whiteListPairAddress1) {
                            exchangeRateUSD = await getUSDRateFromWhiteListPair(whiteListTokens, whiteListPairAddress1, nativeTokenUSDRate)
                            // conversaionRatio = totalAmount1 / totalAmount0;
                            // priceUSD = conversaionRatio * exchangeRateUSD;
                            // totalUSD = totalAmount0 * exchangeRateUSD;
                            transactionType = bigAmount0In > 0 ? 'Sell' : 'Buy';
                            // conversaionRatio = totalAmount1 / totalAmount0;
                            // priceUSD = conversaionRatio * exchangeRateUSD;
                            totalUSD = totalAmount1 * exchangeRateUSD;
                            reserveUSD = reserve1 * exchangeRateUSD;
                        };
                    }
                };

                const priceUSDToken0 = totalUSD / totalAmount0;
                const priceUSDToken1 = totalUSD / totalAmount1;

                const accountconversationRatio = balanceOfDecimal / totalSupplyDecimal;
                const accountliquidityToken0 = reserve0 * accountconversationRatio;
                const accountliquidityToken1 = reserve1 * accountconversationRatio;
                const accountliquidityUSD = (reserveUSD * accountconversationRatio) * 2;

                const values = {
                    transactionHash: swap.transactionHash,
                    sender: senderAddress,
                    receiver: receiverAddress,
                    transactionFrom: transaction.from,
                    pairAddress,
                    accountAddress,
                    hourIndex,
                    hourStartUnix,
                    hourStartDateTime,
                    dayIndex,
                    dayStartTimeStamp,
                    dayStartDateTime,
                    tokenAddress0: pairDetails.tokenAddress0,
                    tokenAddress1: pairDetails.tokenAddress1,
                    totalAmount0,
                    totalAmount1,
                    amount0In,
                    amount1In,
                    amount0Out,
                    amount1Out,
                    transactionDatetime,
                    blockTimeStamp,
                    logIndex: swap.logIndex,
                    blockNumber: transaction.blockNumber,
                    transactionType,
                    exchangeRateUSD,
                    conversaionRatio,
                    priceUSD,
                    priceUSDToken0,
                    priceUSDToken1,
                    totalUSD,
                    totalAmountNativeToken: totalUSD * nativeTokenRateFromUSD,
                    reserve0,
                    reserve1,
                    reserveUSD,
                    reserveNativeToken: reserveUSD * nativeTokenRateFromUSD,
                    actionType,
                    balanceOfDecimal,
                    totalSupplyDecimal,
                    transactionDescription,
                    accountconversationRatio,
                    accountliquidityToken0,
                    accountliquidityToken1,
                    accountliquidityUSD
                }
                // return values;
                transactionData.push(values)
            };
            if (transactionData.length > 0) {
                logDebug(`transactionData: `, transactionData);
                const saveTransactionResult = await saveTransactionInfo(transactionData);
                if (!saveTransactionResult) {
                    return { success: false, message: 'Error saving transaction info', data: [] };
                }

                const updatePairDataResult = await updatePairData(transactionData);
                if (!updatePairDataResult) {
                    return { success: false, message: 'Error updating pair data', data: [] };
                }

                const updateTokenDataResult = await updateTokenData(transactionData);
                if (!updateTokenDataResult) {
                    return { success: false, message: 'Error updating token data', data: [] };
                }

                const updatePairHourlyDataResult = await updatePairHourlyData(transactionData);
                if (!updatePairHourlyDataResult) {
                    return { success: false, message: 'Error updating pair hourly data', data: [] };
                }

                const updatePairDailyDataResult = await updatePairDailyData(transactionData);
                if (!updatePairDailyDataResult) {
                    return { success: false, message: 'Error updating pair daily data', data: [] };
                }

                const updateTokenHourlyDataResult = await updateTokenHourlyData(transactionData);
                if (!updateTokenHourlyDataResult) {
                    return { success: false, message: 'Error updating token hourly data', data: [] };
                }

                const updateTokenDailyDataResult = await updateTokenDailyData(transactionData);
                if (!updateTokenDailyDataResult) {
                    return { success: false, message: 'Error updating token daily data', data: [] };
                }

                const updateAccountDataResult = await updateAccountData(transactionData);
                if (!updateAccountDataResult) {
                    return { success: false, message: 'Error updating Account data', data: [] };
                }

                return { success: true, message: 'Swap Transaction saved Successfully', data: transactionData };
            }
        } else {
            return { success: true, message: 'Swap Transaction not found', data: [] };
        }
    } catch (error) {
        logError("Error in getAndCalcSwapDetailsFromTransactionHash() function:", error);
        return { success: false, message: error, data: [] };
    }
};

const getAndCalcMintDetailsFromTransactionHash = async (provider, transaction) => {
    try {
        // const isTransactionHashExists = await checkTransactionExists(transactionHash);
        // if (!isTransactionHashExists) {
        // const url = process.env.VINOTHIUM_URL;
        const mintAddress = process.env.MINT_ADDRESS
        const syncAddress = process.env.SYNC_ADDRESS
        const transferAddress = process.env.TRANSFER_ADDRESS
        // const provider = ethers.getDefaultProvider(url);
        // const transaction = await provider.getTransactionReceipt(transactionHash);

        const allMints = transaction.logs.filter(x => x.topics[0] === mintAddress);
        if (allMints.length > 0) {
            const allSync = transaction.logs.filter(x => x.topics[0] === syncAddress);
            const allTransfer = transaction.logs.filter(x => x.topics[0] === transferAddress);
            let feeToAddress = await getFeeToAddress();
            feeToAddress = feeToAddress.toLowerCase()

            const block = await provider.getBlock(transaction.blockNumber);
            const blockTimeStamp = block.timestamp * 1000;

            const hourIndex = getHourStartIndex(blockTimeStamp);
            const hourStartUnix = getStartUnix(blockTimeStamp);
            const dayIndex = getDayIndex(blockTimeStamp);
            const dayStartTimeStamp = getDayStartTimeStamp(blockTimeStamp);

            const hourStartDateTime = getUTCDateTimeFromTimeStamp(hourStartUnix);
            const dayStartDateTime = getUTCDateTimeFromTimeStamp(dayStartTimeStamp);

            const transactionDatetime = getUTCDateTimeFromTimeStamp(blockTimeStamp);

            const whiteListTokens = await getActiveWhiteListToken();

            const nativeTokenUSDRate = await getNativeTokenUSDRate();
            logDebug("getAndCalcMintDetailsFromTransactionHash nativeTokenUSDRate", nativeTokenUSDRate);
            const nativeTokenRateFromUSD = 1 / nativeTokenUSDRate;

            const transactionData = []

            for (const mint of allMints) {

                let transactionType = 'Add';
                let exchangeRateUSD = 1;
                let conversaionRatio = 0;
                let priceUSD = 0;
                let totalUSD = 0;
                let actionType = 'Mint';
                let reserve0 = 0;
                let reserve1 = 0;
                let reserveUSD = 0;
                const zeroAddress = '0x'
                let accountAddress = ''

                const pairAddress = mint.address;

                logDebug("allTransfer in Mint", allTransfer);

                const transfer = allTransfer.find(x => {
                    const topic1 = ethers.utils.hexStripZeros(x.topics[1]).toLowerCase()
                    const topic2 = ethers.utils.hexStripZeros(x.topics[2]).toLowerCase()
                    return x.address === pairAddress && topic1 === zeroAddress && topic2 !== zeroAddress && topic2 !== feeToAddress
                }
                )
                logDebug(`transfer in Mint`, transfer);
                if (transfer && transfer.topics.length > 1) {
                    accountAddress = ethers.utils.getAddress(ethers.utils.hexStripZeros(transfer.topics[2]));
                };

                const senderAddress = mint.topics.length >= 2 ? ethers.utils.getAddress(ethers.utils.hexStripZeros(mint.topics[1])) : null;
                const receiverAddress = mint.topics.length >= 2 ? ethers.utils.getAddress(ethers.utils.hexStripZeros(mint.topics[1])) : null;

                logDebug("receiverAddress in Mint", receiverAddress);
                logDebug("pairAddress in Mint", pairAddress);

                const { balanceOf, totalSupply } = await getSupplyAndBalanceFromAccountAddress(pairAddress, accountAddress);

                logDebug(`balanceOf in Mint: `, balanceOf);
                logDebug(`totalSupply in Mint: `, totalSupply);

                const totalSupplyHex = totalSupply._hex;
                const balanceOfHex = balanceOf._hex;

                logDebug(`totalSupplyHex in Mint: `, totalSupplyHex);
                logDebug(`balanceOfHex in Mint: `, balanceOfHex);

                const totalSupplyBigInt = BigInt(totalSupplyHex);
                const balanceOfBigInt = BigInt(balanceOfHex);

                logDebug(`totalSupplyBigInt in Mint: `, totalSupplyBigInt);
                logDebug(`balanceOfBigInt in Mint: `, balanceOfBigInt);

                const totalSupplyDecimal = Number(totalSupplyBigInt);
                const balanceOfDecimal = Number(balanceOfBigInt);

                logDebug(`totalSupplyDecimal in Mint: `, totalSupplyDecimal);
                logDebug(`balanceOfDecimal in Mint: `, balanceOfDecimal);

                const isPairExists = await checkPairExists(pairAddress);
                if (!isPairExists) {
                    await savePairDataFromPairAddress(pairAddress, -1);
                }
                const pairDetails = await getPairDetailsWithTokenInfo(pairAddress);

                const transactionDescription = `Add ${pairDetails.token0Symbol} and ${pairDetails.token1Symbol}`;

                const token0Decimals = pairDetails.token0Decimals;
                const token1Decimals = pairDetails.token1Decimals;

                const sync = allSync.find(x => x.address == pairAddress)
                logDebug("sync", sync);
                if (sync) {
                    const reserveDataWithoutHex = sync.data.slice(2);
                    const bigReserve0 = BigInt('0x' + reserveDataWithoutHex.slice(0, 64));
                    const bigReserve1 = BigInt('0x' + reserveDataWithoutHex.slice(64, 128));

                    reserve0 = convertBigAmountToSmallAmount(bigReserve0, token0Decimals);
                    reserve1 = convertBigAmountToSmallAmount(bigReserve1, token1Decimals);
                };

                const token0whiteList = checkInWhiteListToken(whiteListTokens, pairDetails.tokenAddress0);
                const token1whiteList = checkInWhiteListToken(whiteListTokens, pairDetails.tokenAddress1);

                const dataWithoutHex = mint.data.slice(2);
                const bigAmount0In = BigInt('0x' + dataWithoutHex.slice(0, 64));
                const bigAmount1In = BigInt('0x' + dataWithoutHex.slice(64, 128));

                const totalAmount0 = convertBigAmountToSmallAmount(bigAmount0In, token0Decimals);
                const totalAmount1 = convertBigAmountToSmallAmount(bigAmount1In, token1Decimals);

                if (token0whiteList.whiteListExists && token1whiteList.whiteListExists) { // token0 and token1 both in whitelist
                    if (!token0whiteList.dynamicRate) {
                        // conversaionRatio = totalAmount0 / totalAmount1;
                        // priceUSD = conversaionRatio * exchangeRateUSD;
                        totalUSD = totalAmount0 * exchangeRateUSD;
                        reserveUSD = reserve0 * exchangeRateUSD;

                    } else if (!token1whiteList.dynamicRate) {
                        // conversaionRatio = totalAmount1 / totalAmount0;
                        // priceUSD = conversaionRatio * exchangeRateUSD;
                        totalUSD = totalAmount1 * exchangeRateUSD;
                        reserveUSD = reserve1 * exchangeRateUSD;

                    } else {
                        if (token0whiteList.dynamicRate) {
                            exchangeRateUSD = await getExternalOrNativeUSDRate(token0whiteList.dynamicTokenName, nativeTokenUSDRate)
                        }
                        // conversaionRatio = totalAmount0 / totalAmount1;
                        // priceUSD = conversaionRatio * exchangeRateUSD;
                        totalUSD = totalAmount0 * exchangeRateUSD;
                        reserveUSD = reserve0 * exchangeRateUSD;
                    }
                } else if (token0whiteList.whiteListExists) { // token0 in whitelist
                    logDebug("token0 in whitelist");
                    if (token0whiteList.dynamicRate) {
                        exchangeRateUSD = await getExternalOrNativeUSDRate(token0whiteList.dynamicTokenName, nativeTokenUSDRate)
                    }
                    // conversaionRatio = totalAmount0 / totalAmount1;
                    // priceUSD = conversaionRatio * exchangeRateUSD;
                    totalUSD = totalAmount0 * exchangeRateUSD;
                    reserveUSD = reserve0 * exchangeRateUSD;
                } else if (token1whiteList.whiteListExists) { // token1 in whitelist
                    logDebug("token1 in whitelist");
                    if (token1whiteList.dynamicRate) {
                        exchangeRateUSD = await getExternalOrNativeUSDRate(token1whiteList.dynamicTokenName, nativeTokenUSDRate)
                    }
                    // conversaionRatio = totalAmount1 / totalAmount0;
                    // priceUSD = conversaionRatio * exchangeRateUSD;
                    totalUSD = totalAmount1 * exchangeRateUSD;
                    reserveUSD = reserve1 * exchangeRateUSD;
                } else { // token0 and token1 both are not in the white list
                    logDebug("token0 and token1 both are not in the white list");
                    const whiteListPairAddress0 = await findTokenWhiteListPair(pairDetails.tokenAddress0);
                    if (whiteListPairAddress0) {
                        exchangeRateUSD = await getUSDRateFromWhiteListPair(whiteListTokens, whiteListPairAddress0, nativeTokenUSDRate);
                        // conversaionRatio = totalAmount0 / totalAmount1;
                        // priceUSD = conversaionRatio * exchangeRateUSD;
                        totalUSD = totalAmount0 * exchangeRateUSD;
                        reserveUSD = reserve0 * exchangeRateUSD;
                    }
                    if (totalUSD == 0) {
                        const whiteListPairAddress1 = await findTokenWhiteListPair(pairDetails.tokenAddress1);
                        if (whiteListPairAddress1) {
                            exchangeRateUSD = await getUSDRateFromWhiteListPair(whiteListTokens, whiteListPairAddress1, nativeTokenUSDRate);
                            // conversaionRatio = totalAmount1 / totalAmount0;
                            // priceUSD = conversaionRatio * exchangeRateUSD;
                            totalUSD = totalAmount1 * exchangeRateUSD;
                            reserveUSD = reserve1 * exchangeRateUSD;
                        };
                    }
                };

                const priceUSDToken0 = totalUSD / totalAmount0;
                const priceUSDToken1 = totalUSD / totalAmount1;

                const accountconversationRatio = balanceOfDecimal / totalSupplyDecimal;
                const accountliquidityToken0 = reserve0 * accountconversationRatio;
                const accountliquidityToken1 = reserve1 * accountconversationRatio;
                const accountliquidityUSD = (reserveUSD * accountconversationRatio) * 2;

                const values = {
                    transactionHash: mint.transactionHash,
                    sender: senderAddress,
                    receiver: receiverAddress,
                    transactionFrom: transaction.from,
                    pairAddress,
                    accountAddress,
                    hourIndex,
                    hourStartUnix,
                    hourStartDateTime,
                    dayIndex,
                    dayStartTimeStamp,
                    dayStartDateTime,
                    tokenAddress0: pairDetails.tokenAddress0,
                    tokenAddress1: pairDetails.tokenAddress1,
                    totalAmount0,
                    totalAmount1,
                    amount0In: 0,
                    amount1In: 0,
                    amount0Out: 0,
                    amount1Out: 0,
                    transactionDatetime,
                    blockTimeStamp,
                    logIndex: mint.logIndex,
                    blockNumber: transaction.blockNumber,
                    transactionType,
                    exchangeRateUSD,
                    conversaionRatio,
                    priceUSD,
                    priceUSDToken0,
                    priceUSDToken1,
                    totalUSD,
                    totalAmountNativeToken: totalUSD * nativeTokenRateFromUSD,
                    reserve0,
                    reserve1,
                    reserveUSD,
                    reserveNativeToken: reserveUSD * nativeTokenRateFromUSD,
                    actionType,
                    balanceOfDecimal,
                    totalSupplyDecimal,
                    transactionDescription,
                    accountconversationRatio,
                    accountliquidityToken0,
                    accountliquidityToken1,
                    accountliquidityUSD
                }
                transactionData.push(values);
            }
            if (transactionData.length > 0) {
                logDebug(`transactionData: `, transactionData);
                const saveTransactionResult = await saveTransactionInfo(transactionData);
                if (!saveTransactionResult) {
                    return { success: false, message: 'Error saving transaction info', data: [] };
                }

                const updatePairDataResult = await updatePairData(transactionData);
                if (!updatePairDataResult) {
                    return { success: false, message: 'Error updating pair data', data: [] };
                }

                const updateTokenDataResult = await updateTokenData(transactionData);
                if (!updateTokenDataResult) {
                    return { success: false, message: 'Error updating token data', data: [] };
                }

                const updatePairHourlyDataResult = await updatePairHourlyData(transactionData);
                if (!updatePairHourlyDataResult) {
                    return { success: false, message: 'Error updating pair hourly data', data: [] };
                }

                const updatePairDailyDataResult = await updatePairDailyData(transactionData);
                if (!updatePairDailyDataResult) {
                    return { success: false, message: 'Error updating pair daily data', data: [] };
                }

                const updateTokenHourlyDataResult = await updateTokenHourlyData(transactionData);
                if (!updateTokenHourlyDataResult) {
                    return { success: false, message: 'Error updating token hourly data', data: [] };
                }

                const updateTokenDailyDataResult = await updateTokenDailyData(transactionData);
                if (!updateTokenDailyDataResult) {
                    return { success: false, message: 'Error updating token daily data', data: [] };
                }

                const updateAccountDataResult = await updateAccountData(transactionData);
                if (!updateAccountDataResult) {
                    return { success: false, message: 'Error updating Account data', data: [] };
                }

                return { success: true, message: 'Mint Transaction saved Successfully', data: transactionData };
            }
        } else {
            return { success: true, message: 'Mint Transaction not found', data: [] };
        }
    } catch (error) {
        logError("Error in getAndCalcMintDetailsFromTransactionHash() function:", error);
        return { success: false, message: error, data: [] };
    }
};

const getAndCalcBurnDetailsFromTransactionHash = async (provider, transaction) => {
    try {
        // const isTransactionHashExists = await checkTransactionExists(transactionHash);
        // if (!isTransactionHashExists) {
        // const url = process.env.VINOTHIUM_URL;
        const burnAddress = process.env.BURN_ADDRESS
        const syncAddress = process.env.SYNC_ADDRESS
        const transferAddress = process.env.TRANSFER_ADDRESS
        // const provider = ethers.getDefaultProvider(url);
        // const transaction = await provider.getTransactionReceipt(transactionHash);

        const allBurns = transaction.logs.filter(x => x.topics[0] === burnAddress);
        if (allBurns.length > 0) {
            const allSync = transaction.logs.filter(x => x.topics[0] === syncAddress);
            const allTransfer = transaction.logs.filter(x => x.topics[0] === transferAddress);
            logDebug(`allTransfer in Burn`, allTransfer);

            const block = await provider.getBlock(transaction.blockNumber);
            const blockTimeStamp = block.timestamp * 1000;

            const hourIndex = getHourStartIndex(blockTimeStamp);
            const hourStartUnix = getStartUnix(blockTimeStamp);
            const dayIndex = getDayIndex(blockTimeStamp);
            const dayStartTimeStamp = getDayStartTimeStamp(blockTimeStamp);

            const hourStartDateTime = getUTCDateTimeFromTimeStamp(hourStartUnix);
            const dayStartDateTime = getUTCDateTimeFromTimeStamp(dayStartTimeStamp);

            const transactionDatetime = getUTCDateTimeFromTimeStamp(blockTimeStamp);

            const whiteListTokens = await getActiveWhiteListToken();

            const nativeTokenUSDRate = await getNativeTokenUSDRate();
            logDebug("getAndCalcBurnDetailsFromTransactionHash nativeTokenUSDRate", nativeTokenUSDRate);
            const nativeTokenRateFromUSD = 1 / nativeTokenUSDRate;

            const transactionData = []

            for (const burn of allBurns) {

                let transactionType = 'Remove';
                let exchangeRateUSD = 1;
                let conversaionRatio = 0;
                let priceUSD = 0;
                let totalUSD = 0;
                let actionType = 'Burn';
                let reserve0 = 0;
                let reserve1 = 0;
                let reserveUSD = 0;
                let accountAddress = ''

                const pairAddress = burn.address;
                logDebug("all transfer", allTransfer)
                const transfer = allTransfer.find(x =>
                    x.address === pairAddress && ethers.utils.hexStripZeros(x.topics[2]).toLowerCase() == ethers.utils.hexStripZeros(pairAddress).toLowerCase()
                )
                if (transfer && transfer.topics.length > 1) {
                    accountAddress = ethers.utils.getAddress(ethers.utils.hexStripZeros(transfer.topics[1]));
                }

                logDebug(`transfer in Burn`, transfer);

                const senderAddress = burn.topics.length >= 2 ? ethers.utils.getAddress(ethers.utils.hexStripZeros(burn.topics[1])) : null;
                const receiverAddress = burn.topics.length >= 3 ? ethers.utils.getAddress(ethers.utils.hexStripZeros(burn.topics[2])) : null;
                const { totalSupply, balanceOf } = await getSupplyAndBalanceFromAccountAddress(pairAddress, accountAddress);

                logDebug("totalSupply in Burn", totalSupply);
                logDebug("balanceOf in Burn", balanceOf);

                const totalSupplyHex = totalSupply._hex;
                const balanceOfHex = balanceOf._hex;

                const totalSupplyBigInt = BigInt(totalSupplyHex);
                const balanceOfBigInt = BigInt(balanceOfHex);

                const totalSupplyDecimal = Number(totalSupplyBigInt);
                const balanceOfDecimal = Number(balanceOfBigInt);

                logDebug("totalSupplyHex in Burn", totalSupplyHex);
                logDebug("balanceOfHex in Burn", balanceOfHex);
                logDebug("totalSupplyBigInt in Burn", totalSupplyBigInt);
                logDebug("balanceOfBigInt in Burn", balanceOfBigInt);
                logDebug("totalSupplyDecimal in Burn", totalSupplyDecimal);
                logDebug("balanceOfDecimal in Burn", balanceOfDecimal);

                const isPairExists = await checkPairExists(pairAddress);
                if (!isPairExists) {
                    await savePairDataFromPairAddress(pairAddress, -1);
                }
                const pairDetails = await getPairDetailsWithTokenInfo(pairAddress);

                const transactionDescription = `Remove ${pairDetails.token0Symbol} and ${pairDetails.token1Symbol}`;

                const token0Decimals = pairDetails.token0Decimals;
                const token1Decimals = pairDetails.token1Decimals;

                const sync = allSync.find(x => x.address == pairAddress)
                if (sync) {
                    const reserveDataWithoutHex = sync.data.slice(2);
                    const bigReserve0 = Number('0x' + reserveDataWithoutHex.slice(0, 64));
                    const bigReserve1 = Number('0x' + reserveDataWithoutHex.slice(64, 128));

                    reserve0 = convertBigAmountToSmallAmount(bigReserve0, token0Decimals);
                    reserve1 = convertBigAmountToSmallAmount(bigReserve1, token1Decimals);
                };

                const token0whiteList = checkInWhiteListToken(whiteListTokens, pairDetails.tokenAddress0);
                const token1whiteList = checkInWhiteListToken(whiteListTokens, pairDetails.tokenAddress1);

                const dataWithoutHex = burn.data.slice(2);
                const bigAmount0 = BigInt('0x' + dataWithoutHex.slice(0, 64));
                const bigAmount1In = BigInt('0x' + dataWithoutHex.slice(64, 128));

                const totalAmount0 = convertBigAmountToSmallAmount(bigAmount0, token0Decimals)
                const totalAmount1 = convertBigAmountToSmallAmount(bigAmount1In, token1Decimals)

                if (token0whiteList.whiteListExists && token1whiteList.whiteListExists) { // token0 and token1 both in whitelist
                    if (!token0whiteList.dynamicRate) {
                        // conversaionRatio = totalAmount0 / totalAmount1;
                        // priceUSD = conversaionRatio * exchangeRateUSD;
                        totalUSD = totalAmount0 * exchangeRateUSD;
                        reserveUSD = reserve0 * exchangeRateUSD;

                    } else if (!token1whiteList.dynamicRate) {
                        // conversaionRatio = totalAmount1 / totalAmount0;
                        // priceUSD = conversaionRatio * exchangeRateUSD;
                        totalUSD = totalAmount1 * exchangeRateUSD;
                        reserveUSD = reserve1 * exchangeRateUSD;

                    } else {
                        if (token0whiteList.dynamicRate) {
                            exchangeRateUSD = await getExternalOrNativeUSDRate(token0whiteList.dynamicTokenName, nativeTokenUSDRate)
                        }
                        // conversaionRatio = totalAmount0 / totalAmount1;
                        // priceUSD = conversaionRatio * exchangeRateUSD;
                        totalUSD = totalAmount0 * exchangeRateUSD;
                        reserveUSD = reserve0 * exchangeRateUSD;
                    }
                } else if (token0whiteList.whiteListExists) { // token0 in whitelist
                    logDebug("token0 in whitelist");
                    if (token0whiteList.dynamicRate) {
                        exchangeRateUSD = await getExternalOrNativeUSDRate(token0whiteList.dynamicTokenName, nativeTokenUSDRate)
                    }
                    // conversaionRatio = totalAmount0 / totalAmount1;
                    // priceUSD = conversaionRatio * exchangeRateUSD;
                    totalUSD = totalAmount0 * exchangeRateUSD;
                    reserveUSD = reserve0 * exchangeRateUSD;
                } else if (token1whiteList.whiteListExists) { // token1 in whitelist
                    logDebug("token1 in whitelist");
                    if (token1whiteList.dynamicRate) {
                        exchangeRateUSD = await getExternalOrNativeUSDRate(token1whiteList.dynamicTokenName, nativeTokenUSDRate)
                    }
                    // conversaionRatio = totalAmount1 / totalAmount0;
                    // priceUSD = conversaionRatio * exchangeRateUSD;
                    totalUSD = totalAmount1 * exchangeRateUSD;
                    reserveUSD = reserve1 * exchangeRateUSD;
                } else { // token0 and token1 both are not in the white list
                    logDebug("token0 and token1 both are not in the white list");
                    const whiteListPairAddress0 = await findTokenWhiteListPair(pairDetails.tokenAddress0);
                    if (whiteListPairAddress0) {
                        exchangeRateUSD = await getUSDRateFromWhiteListPair(whiteListTokens, whiteListPairAddress0, nativeTokenUSDRate);
                        // conversaionRatio = totalAmount0 / totalAmount1;
                        // priceUSD = conversaionRatio * exchangeRateUSD;
                        totalUSD = totalAmount0 * exchangeRateUSD;
                        reserveUSD = reserve0 * exchangeRateUSD;
                    }
                    if (totalUSD == 0) {
                        const whiteListPairAddress1 = await findTokenWhiteListPair(pairDetails.tokenAddress1);
                        if (whiteListPairAddress1) {
                            exchangeRateUSD = await getUSDRateFromWhiteListPair(whiteListTokens, whiteListPairAddress1, nativeTokenUSDRate);
                            // conversaionRatio = totalAmount1 / totalAmount0;
                            // priceUSD = conversaionRatio * exchangeRateUSD;
                            totalUSD = totalAmount1 * exchangeRateUSD;
                            reserveUSD = reserve1 * exchangeRateUSD;
                        };
                    }
                };

                const priceUSDToken0 = totalUSD / totalAmount0;
                const priceUSDToken1 = totalUSD / totalAmount1;

                const accountconversationRatio = balanceOfDecimal / totalSupplyDecimal;
                const accountliquidityToken0 = reserve0 * accountconversationRatio;
                const accountliquidityToken1 = reserve1 * accountconversationRatio;
                const accountliquidityUSD = reserveUSD * accountconversationRatio * 2;

                logDebug("accountconversationRatio in Burn", accountconversationRatio);
                logDebug("accountliquidityToken0 in Burn", accountliquidityToken0);
                logDebug("accountliquidityToken1 in Burn", accountliquidityToken1);
                logDebug("accountliquidityUSD in Burn", accountliquidityUSD);

                const values = {
                    transactionHash: burn.transactionHash,
                    sender: senderAddress,
                    receiver: receiverAddress,
                    transactionFrom: transaction.from,
                    pairAddress,
                    accountAddress,
                    hourIndex,
                    hourStartUnix,
                    hourStartDateTime,
                    dayIndex,
                    dayStartTimeStamp,
                    dayStartDateTime,
                    tokenAddress0: pairDetails.tokenAddress0,
                    tokenAddress1: pairDetails.tokenAddress1,
                    totalAmount0,
                    totalAmount1,
                    amount0In: 0,
                    amount1In: 0,
                    amount0Out: 0,
                    amount1Out: 0,
                    transactionDatetime,
                    blockTimeStamp,
                    logIndex: burn.logIndex,
                    blockNumber: transaction.blockNumber,
                    transactionType,
                    exchangeRateUSD,
                    conversaionRatio,
                    priceUSD,
                    priceUSDToken0,
                    priceUSDToken1,
                    totalUSD,
                    totalAmountNativeToken: totalUSD * nativeTokenRateFromUSD,
                    reserve0,
                    reserve1,
                    reserveUSD,
                    reserveNativeToken: reserveUSD * nativeTokenRateFromUSD,
                    actionType,
                    balanceOfDecimal,
                    totalSupplyDecimal,
                    transactionDescription,
                    accountconversationRatio,
                    accountliquidityToken0,
                    accountliquidityToken1,
                    accountliquidityUSD
                }
                transactionData.push(values);
            };
            if (transactionData.length > 0) {
                logDebug(`transactionData: `, transactionData);
                const saveTransactionResult = await saveTransactionInfo(transactionData);
                if (!saveTransactionResult) {
                    return { success: false, message: 'Error saving transaction info', data: [] };
                }

                const updatePairDataResult = await updatePairData(transactionData);
                if (!updatePairDataResult) {
                    return { success: false, message: 'Error updating pair data', data: [] };
                }

                const updateTokenDataResult = await updateTokenData(transactionData);
                if (!updateTokenDataResult) {
                    return { success: false, message: 'Error updating token data', data: [] };
                }

                const updatePairHourlyDataResult = await updatePairHourlyData(transactionData);
                if (!updatePairHourlyDataResult) {
                    return { success: false, message: 'Error updating pair hourly data', data: [] };
                }

                const updatePairDailyDataResult = await updatePairDailyData(transactionData);
                if (!updatePairDailyDataResult) {
                    return { success: false, message: 'Error updating pair daily data', data: [] };
                }

                const updateTokenHourlyDataResult = await updateTokenHourlyData(transactionData);
                if (!updateTokenHourlyDataResult) {
                    return { success: false, message: 'Error updating token hourly data', data: [] };
                }

                const updateTokenDailyDataResult = await updateTokenDailyData(transactionData);
                if (!updateTokenDailyDataResult) {
                    return { success: false, message: 'Error updating token daily data', data: [] };
                }

                const updateAccountDataResult = await updateAccountData(transactionData);
                if (!updateAccountDataResult) {
                    return { success: false, message: 'Error updating Account data', data: [] };
                }

                return { success: true, message: 'Burn Transaction saved Successfully', data: transactionData };
            }
        } else {
            return { success: true, message: 'Burn Transaction not found', data: [] };
        }
    } catch (error) {
        logError("Error in getAndCalcBurnDetailsFromTransactionHash() function:", error);
        return { success: false, message: error, data: [] };
    }
};

const getUSDRateFromWhiteListPair = async (whiteListTokens, pairAddress, nativeTokenUSDRate) => {
    try {
        const pairDetails = await getPairDetailsWithTokenInfo(pairAddress);

        const token0whiteList = checkInWhiteListToken(whiteListTokens, pairDetails.tokenAddress0);
        const token1whiteList = checkInWhiteListToken(whiteListTokens, pairDetails.tokenAddress1);
        let priceUSD = 0
        let exchangeRateUSD = 1
        if (token0whiteList.whiteListExists) {
            logDebug("getUSDRateFromWhiteListPair token0 in whitelist");
            const tokenAmount = await getAmountsOutFromRouter(pairDetails.tokenAddress1, pairDetails.token1Decimals, pairDetails.tokenAddress0, pairDetails.token0Decimals);
            if (token0whiteList.dynamicRate) {
                exchangeRateUSD = await getExternalOrNativeUSDRate(token0whiteList.dynamicTokenName, nativeTokenUSDRate)
            }
            priceUSD = tokenAmount * exchangeRateUSD
        } else if (token1whiteList.whiteListExists) {
            logDebug("getUSDRateFromWhiteListPair token1 in whitelist");
            const tokenAmount = await getAmountsOutFromRouter(pairDetails.tokenAddress0, pairDetails.token0Decimals, pairDetails.tokenAddress1, pairDetails.token1Decimals);
            if (token1whiteList.dynamicRate) {
                exchangeRateUSD = await getExternalOrNativeUSDRate(token1whiteList.dynamicTokenName, nativeTokenUSDRate)
            }
            priceUSD = tokenAmount * exchangeRateUSD
        }
        logDebug(`getUSDRateFromWhiteListPair pairUSD: `, priceUSD);
        return priceUSD;
    } catch (error) {
        logError("Error in findTokenWhiteListPair() function:", error);
        return 0;
    }
};

const getAmountsOutFromRouter = async (baseTokenAddress, baseTokenDigits, quoteTokenAddress, quoteTokenDigits) => {
    try {
        const amountIn = convertSmallAmountToBigAmount(1, baseTokenDigits)
        const bigAmountsOut = await findAmountsOut(amountIn, [baseTokenAddress, quoteTokenAddress]);
        const amountOut = convertBigAmountToSmallAmount(bigAmountsOut, quoteTokenDigits);
        logDebug(`amountOut: `, amountOut);
        return amountOut;
    } catch (error) {
        logError("Error in getAmountsOutFromRouter() function:", error);
        return 0;
    }
};

module.exports = {
    getAndCalcTransactionDetailsFromTransactionHash,
    getAndCalcTransactionDetailsFromTransactionQueueHash
};