const path = require("path");
const { version, name } = require("../package.json");

module.exports = {
    version,
    name,
    cwd: path.resolve(process.cwd()),
    config: ".devops",
    shareEnv: "share.env",
    localEnv: "local.env",
    devScripts: "dev",
    devDeployments: "local",
    devTestSuites: "test",
    prodBuildScripts: "build",
    prodReleaseVersions: "release",
    prodProvisionConfigs: "provision",
    prodConfigureConfigs: "configure",
    prodStacks: "deploy",
    prodBackupScripts: "backup",
    prodRestoreScripts: "restore"
};
