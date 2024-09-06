const generalSettingDbService = require("../services/database-services/general-setting-db.service");
const { logError } = require("../services/common-services/log-common.service");
const { getFeeAddressFromContract } = require('../services/contract-services/factory-contract.service');

const updateFeeAddress = async (req, res) => {
    try {
        const privateKey = req.headers['privatekey'];

        if (privateKey !== process.env.PRIVATE_KEY) {
            return res.status(401).json({ success: false, message: "Unauthorized: Invalid private key" });
        }
        const factoryAddress = process.env.VINOTHIUM_CONTRACT_ADDRESS
        const feeToAddress = await getFeeAddressFromContract(factoryAddress);
        await generalSettingDbService.updateFeeToAddress(feeToAddress);
        const feeToAddreess = await generalSettingDbService.getFeeToAddress();
        if (feeToAddreess) {
            res.status(200).json({
                success: true,
                message: "Fee Addreess has been updated Successfully.",
                data: feeToAddreess
            });
        };
    } catch (error) {
        logError("Error in updateFeeAddress() function:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

module.exports = { updateFeeAddress }