const replaceUnwantedChar = (str) => {
    try {
        let replacedStr = str;
        replacedStr = replacedStr.replace("'", "''")
        return replacedStr;
    } catch (error) {
        logError("Error in function replaceUnwantedChar()", error);
    }
};

module.exports = {
    replaceUnwantedChar
}