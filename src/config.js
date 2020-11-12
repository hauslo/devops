const path = require("path");
const { version } = require("../package.json");

module.exports = {
    version,
    cwd: path.resolve(process.cwd()),
    config: ".devops",
    shareEnv: "share.env",
    localEnv: "local.env",
    devScripts: "dev",
    devDeployments: "local",
    devTestSuites: "test",
    prodBuildScripts: "build",
    prodReleaseVersions: "release",
    prodInfrastructureConfigs: "infra",
    prodClusterConfigs: "cluster",
    prodStacks: "deploy",
    prodBackupScripts: "backup",
    prodRestoreScripts: "restore"
};
