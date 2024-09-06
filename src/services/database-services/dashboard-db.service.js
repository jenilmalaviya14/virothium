const { executeQuery } = require('../../db/db-query');
const { logError, logDebug } = require('../common-services/log-common.service');

const getNativeTokenInfo = async (nativeTokenAddress) => {
    try {
        let sql;
        sql = `CALL report_token_overview('${nativeTokenAddress}')`;
        const results = await executeQuery(sql);
        if (results) {
            const [[[tokenDetails]]] = results;
            return tokenDetails;
        }
        return null;
    } catch (error) {
        logError('Error in getNativeTokenInfo() function:', error);
        throw error;
    }
};

const getOverviewTokenInfo = async () => {
    try {
        let sql;
        sql = `CALL report_platform_overview()`;
        const results = await executeQuery(sql);
        if (results) {
            const [[[tokenDetails]]] = results;
            return tokenDetails;
        }
        return null;
    } catch (error) {
        logError('Error in getOverviewTokenInfo() function:', error);
        throw error;
    }
};

const getDashboarChartData = async (periodType, periodTime) => {
    try {
        let sql;
        sql = `CALL dashboard_chart('${periodType}', ${periodTime})`;
        const results = await executeQuery(sql);
        if (results) {
            const [[tokenChartDetails]] = results;
            return tokenChartDetails;
        }
        return null;
    } catch (error) {
        logError('Error in findChartsByTokenAddress() function:', error);
        throw error;
    }
};

module.exports = { getNativeTokenInfo, getOverviewTokenInfo, getDashboarChartData }