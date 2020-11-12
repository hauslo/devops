const path = require("path");

const config = require("./config");
const importEnvFile = require("./lib/importEnvFile");

const env = {
    DEVOPS_VERSION: config.version,
    DEVOPS_ROOT: config.cwd,
    DEVOPS_CONFIG: config.config
};

module.exports.env = () => ({ ...env });

module.exports.import = async (...files) =>
    importEnvFile(
        path.join(config.config, config.localEnv),
        path.join(config.config, config.shareEnv),
        ...files
    ).then(importedEnv => ({ ...env, ...importedEnv }));
