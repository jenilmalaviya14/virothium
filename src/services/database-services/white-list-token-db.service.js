const { executeQuery } = require('../../db/db-query');
const { logError } = require('../common-services/log-common.service');

const checkTokenAddressInWhiteList = async (tokenAddress) => {
    try {
        const sql = `SELECT * FROM white_list_token WHERE tokenAddress = '${tokenAddress}'`;
        const results = await executeQuery(sql);
        if (results && results.length > 0) {
            return true;
        }
        return false;
    } catch (error) {
        logError("Error in checkTokenAddressInWhiteList() function:", error);
        throw error;
    }
};

const getActiveWhiteListToken = async () => {
    try {
        const sql = `SELECT * FROM white_list_token WHERE tokenStatus = 1`;
        const results = await executeQuery(sql);
        if (results) {
            const [rows] = results;
            return rows;
        }
        return null;
    } catch (error) {
        logError("Error in checkTokenAddressInWhiteList() function:", error);
        throw error;
    }
};

const getTokenAddressByDynamicTokenName = async (dynamicTokenName) => {
    try {
        const sql = `SELECT tokenAddress FROM white_list_token WHERE dynamicTokenName = '${dynamicTokenName}'`;
        const results = await executeQuery(sql);
        if (results) {
            const [rows] = results;
            return rows;
        }
        return null;
    } catch (error) {
        logError("Error in getTokenAddressByDynamicTokenName() function:", error);
        throw error;
    }
};

const getPairAddressFromWhiteListTokenAddress = async (tokenAddress) => {
    try {
        const sql = `SELECT
                    pm.pairAddress
                    FROM pair_master pm
                    INNER JOIN white_list_token wt ON (pm.tokenAddress0 = wt.tokenAddress OR pm.tokenAddress1 = wt.tokenAddress) AND wt.tokenStatus = 1
                    WHERE (pm.tokenAddress0 = '${tokenAddress}' OR pm.tokenAddress1 = '${tokenAddress}')
                    ORDER BY wt.dynamicRate
                    LIMIT 1;`;
        const results = await executeQuery(sql);
        if (results) {
            const [[rows]] = results;
            return rows ? rows.pairAddress : null;
        }
        return null;
    } catch (error) {
        logError("Error in getPairAddressFromWhiteListTokenAddress() function:", error);
        throw error;
    }
};


module.exports = { checkTokenAddressInWhiteList, getActiveWhiteListToken, getPairAddressFromWhiteListTokenAddress, getTokenAddressByDynamicTokenName };