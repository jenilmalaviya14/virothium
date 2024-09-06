const express = require('express');
const router = express.Router();
const generalSettingController = require("../controller/general-setting.controller");

router.post(
    "/general-setting/update-fee-address",
    generalSettingController.updateFeeAddress
);

module.exports = router;