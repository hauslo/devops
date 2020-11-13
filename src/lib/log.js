/* eslint-disable no-console */
const debug = require("debug");
const { name: NAME } = require("../../package.json");

module.exports = (namespace, { debugOnly = true } = {}) => {
    const thisDebug = debug(`${NAME}:${namespace}`);
    return {
        log: (...args) => {
            if (!thisDebug.enabled && !debugOnly) {
                console.error(...args);
            } else {
                thisDebug(...args);
            }
        },
        debug: thisDebug
    };
};

const defaultDebug = debug(NAME);

module.exports.log = (...args) => {
    if (defaultDebug.enabled) {
        defaultDebug(...args);
    } else {
        console.error(...args);
    }
};

module.exports.debug = defaultDebug;
