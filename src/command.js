const path = require("path");
const fsp = require("fs").promises;
const { version, cwd, config, devDeployments, devTestSuites, devScripts } = require("./config");
const { import: importEnv } = require("./env");
const dockerBuildAndRun = require("./lib/dockerBuildAndRun");
const dockerCompose = require("./lib/dockerCompose");
// const dockerBuild = require("./lib/dockerBuild");

module.exports.version = () => version;

module.exports.env = async ({ envFile = [] }) => importEnv(...envFile);

module.exports.start = async (deployment, { envFile = [], it = false }) => {
    const importedEnv = await importEnv(...envFile);
    const composeFile = path.join(config, devDeployments, `${deployment}.yml`);
    await fsp.stat(composeFile).catch(err => {
        if (err.code !== "ENOENT") {
            throw err;
        } else {
            throw new Error(
                `Deployment "${deployment}" not found (${path.join(config, devDeployments, `${deployment}.yml`)})`
            );
        }
    });

    return dockerCompose(composeFile, "up", { cwd, it, env: importedEnv });
};

module.exports.stop = async (deployment, { envFile = [], it = false }) => {
    const importedEnv = await importEnv(...envFile);
    const composeFile = path.join(config, devDeployments, `${deployment}.yml`);
    await fsp.stat(composeFile).catch(err => {
        if (err.code !== "ENOENT") {
            throw err;
        } else {
            throw new Error(
                `Deployment "${deployment}" not found (${path.join(config, devDeployments, `${deployment}.yml`)})`
            );
        }
    });

    return dockerCompose(composeFile, "down", { cwd, it, env: importedEnv });
};

module.exports.test = async (suite, args = [], { envFile = [], it = true }) => {
    const importedEnv = await importEnv(...envFile);
    const dockerFile = path.join(config, devTestSuites, `${suite}.Dockerfile`);
    await fsp.stat(dockerFile).catch(err => {
        if (err.code !== "ENOENT") {
            throw err;
        } else {
            throw new Error(
                `Test suite ${suite} not found (${path.join(config, devTestSuites, `${suite}.Dockerfile`)})`
            );
        }
    });

    return dockerBuildAndRun(dockerFile, args, { cwd, it, env: importedEnv });
};

module.exports.dev = async (service, script, args = [], { envFile = [], it = true }) => {
    const importedEnv = await importEnv(...envFile);
    const dockerFile = path.join(config, devScripts, service, `${script}.Dockerfile`);
    await fsp.stat(dockerFile).catch(err => {
        if (err.code !== "ENOENT") {
            throw err;
        } else {
            throw new Error(
                `${service}: Dev script ${script} not found (${path.join(
                    config,
                    devScripts,
                    service,
                    `${script}.Dockerfile`
                )})`
            );
        }
    });

    return dockerBuildAndRun(dockerFile, args, { cwd, it, env: importedEnv });
};
