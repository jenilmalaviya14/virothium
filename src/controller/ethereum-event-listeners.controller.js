// const ethers = require("ethers");
// const ABI = require("../abi/abi.json");
// const factoryABI = require("../abi/factoryabi.json");
// const routerABI = require("../abi/routerabi.json");

// let listenForUSDCTransfer = async () => {
//     const url = process.env.ALCHEMY_WEBSOCKET;
//     const usdcAddress = process.env.USDC_ADDRESS;
//     const provider = new ethers.providers.JsonRpcProvider(url);
//     const contract = new ethers.Contract(usdcAddress, ABI, provider);

//     contract.on("Transfer", (from, to, value, event) => {

//         let transferEvent = {
//             from: from,
//             to: to,
//             value: value,
//             eventData: event,
//         }

//         console.log(JSON.stringify(transferEvent, null, 4))

//     })
// }

// const listenForUSDCPairCreation = async () => {
//     const url = process.env.ALCHEMY_WEBSOCKET;
//     const usdcAddress = process.env.USDC_ADDRESS;
//     const provider = new ethers.providers.JsonRpcProvider(url);
//     const contract = new ethers.Contract(usdcAddress, factoryABI, provider);

//     contract.on("PairCreated", (from, to, value, event) => {

//         let pairCreatedEvent = {
//             from: from,
//             to: to,
//             value: value,
//             eventData: event,
//         }

//         console.log(JSON.stringify(pairCreatedEvent, null, 4))

//     })
// }

// const listenForUSDCSwap = async () => {
//     const url = process.env.ALCHEMY_WEBSOCKET;
//     const usdcAddress = process.env.USDC_ADDRESS;
//     const provider = new ethers.providers.JsonRpcProvider(url);
//     const contract = new ethers.Contract(usdcAddress, routerABI, provider);

//     contract.on("Swap", (from, to, value, event) => {

//         let transferEvent = {
//             from: from,
//             to: to,
//             value: value,
//             eventData: event,
//         }

//         console.log(JSON.stringify(transferEvent, null, 4))

//     })
// }



// // listenForUSDCTransfer();
// // listenForUSDCPairCreation();
// // listenForUSDCSwap();