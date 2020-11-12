const { name: NAME } = require("../../package.json");
// eslint-disable-next-line import/order
const debug = require("debug")(`${NAME}`);

const log = (...args) => {
    if (debug.enabled) {
        debug(...args);
    } else {
        // eslint-disable-next-line no-console
        console.error(...args);
    }
};

module.exports = { debug, log };
