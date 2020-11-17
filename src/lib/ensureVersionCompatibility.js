const semver = require("semver");
const { version: VERSION } = require("../config");

module.exports = version => {
    if (!/^\d+(?:\.\d+)(?:\.\d+)$/.test(version)) {
        throw new Error(`Invalid version : ${version} - expected x or x.y format`);
    }
    if (!semver.satisfies(VERSION, version)) {
        throw new Error(`Incompatible versions : devops v${VERSION} - config v${version}`);
    }
};
