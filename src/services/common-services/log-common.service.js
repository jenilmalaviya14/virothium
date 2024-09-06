const fs = require('fs');
const path = require('path');
const cron = require('cron');

const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const createLogFolder = () => {
    const currentDate = getCurrentDate();
    const logFolderPath = path.join(__dirname, '../../../public/logs', currentDate);

    if (!fs.existsSync(logFolderPath)) {
        fs.mkdirSync(logFolderPath, { recursive: true });
    }

    return logFolderPath;
};

const logError = (functionName, error) => {
    const logFolderPath = createLogFolder();
    const errorLogPath = path.join(logFolderPath, 'error-log.txt');
    const timestamp = new Date().toISOString();

    const errorMessage = `[${timestamp}] ${functionName} Error: ${error.message}\n`;

    fs.appendFile(errorLogPath, errorMessage, (err) => {
        if (err) console.error('Error logging to error log:', err);
    });
    console.error(functionName, error);
    logDebug(functionName, error)
};

function stringifyBigInts(obj) {
    return JSON.stringify(obj, (key, value) => typeof value === 'bigint' ? value.toString() : value);
}

const logDebug = (functionName, message) => {
    const logFolderPath = createLogFolder();
    const debugLogPath = path.join(logFolderPath, 'debug-log.txt');
    const timestamp = new Date().toISOString();

    if (message !== undefined) {
        const debugMessage = `[${timestamp}] ${functionName}: ${stringifyBigInts(message)}\n`;

        fs.appendFile(debugLogPath, debugMessage, (err) => {
            if (err) console.error('Error logging to debug log:', err);
        });
        console.log(functionName, message);
    } else {
        const debugMessage = `[${timestamp}] ${functionName}\n`;

        fs.appendFile(debugLogPath, debugMessage, (err) => {
            if (err) console.error('Error logging to debug log:', err);
        });
        console.log(functionName);
    }
};

const deleteOldFolders = () => {
    const logsDirectory = path.join(__dirname, '../../../public/logs');

    fs.readdir(logsDirectory, (err, folders) => {
        if (err) {
            console.error('Error reading logs directory:', err);
            return;
        }

        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() - 5); // Set the threshold date to 5 days ago
        const thresholdDate = currentDate.toISOString().split('T')[0];

        folders.forEach(folder => {
            if (folder < thresholdDate) {
                const folderPath = path.join(logsDirectory, folder);

                fs.rmdir(folderPath, { recursive: true }, err => {
                    if (err) {
                        console.error(`Error deleting folder ${folderPath}:`, err);
                    } else {
                        console.log(`Deleted folder ${folderPath}`);
                    }
                });
            }
        });
    });
};

const deleteOldFoldersJob = new cron.CronJob('0 0 * * *', deleteOldFolders, null, true, 'UTC');
deleteOldFoldersJob.start();

module.exports = {
    logDebug,
    logError
}