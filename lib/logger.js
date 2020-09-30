module.exports.logIfDebug = (fileName, lineCode, message) => {
    console.log(`${fileName}: ${lineCode}// ${message}`);
}