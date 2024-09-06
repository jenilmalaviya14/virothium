const db = require('./dbconnection');
const { logError, logDebug } = require('../services/common-services/log-common.service')

const executeQuery = async (sql) => {
    const conn = await db.connection()
    try {
        const results = await conn.execute(sql);
        conn.release()
        return results;
    } catch (error) {
        logError("Error in executeQuery() function:", error);
        conn.release()
        return null;
    }
}

module.exports = {
    executeQuery
}