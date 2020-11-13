const path = require("path");
const fsp = require("fs").promises;
const {
    version,
    cwd,
    config,
    devDeployments,
    devTestSuites,
    devScripts,
    prodBuildScripts,
    prodReleaseVersions
} = require("./config");
const { import: importEnv } = require("./env");
const ensureVersionCompatibility = require("./lib/ensureVersionCompatibility");
const dockerBuildAndRun = require("./lib/dockerBuildAndRun");
const dockerCompose = require("./lib/dockerCompose");
const dockerBuild = require("./lib/dockerBuild");
const dockerTag = require("./lib/dockerTag");

module.exports.version = () => version;

module.exports.env = async ({ envFile = [] }) => {
    const importedEnv = await importEnv(...envFile);
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
    return importedEnv;
};

module.exports.start = async (deployment, { envFile = [], it = false }) => {
    const importedEnv = await importEnv(...envFile);
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
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
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
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
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
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
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
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
    let serviceWorkingDirectory;
    await fsp.stat(path.join(cwd, service)).then(
        stats => {
            if (stats.isDirectory()) {
                serviceWorkingDirectory = path.join(cwd, service);
            } else {
                serviceWorkingDirectory = cwd;
            }
        },
        err => {
            if (err.code !== "ENOENT") {
                throw err;
            } else {
                serviceWorkingDirectory = cwd;
            }
        }
    );

    return dockerBuildAndRun(dockerFile, args, { cwd: serviceWorkingDirectory, it, env: importedEnv });
};

module.exports.build = async (service, { envFile = [] }) => {
    const importedEnv = await importEnv(...envFile);
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
    const dockerFile = path.join(config, prodBuildScripts, `${service}.Dockerfile`);
    await fsp.stat(dockerFile).catch(err => {
        if (err.code !== "ENOENT") {
            throw err;
        } else {
            throw new Error(
                `Build script ${service} not found (${path.join(config, prodBuildScripts, `${service}.Dockerfile`)})`
            );
        }
    });
    let serviceWorkingDirectory;
    await fsp.stat(path.join(cwd, service)).then(
        stats => {
            if (stats.isDirectory()) {
                serviceWorkingDirectory = path.join(cwd, service);
            } else {
                serviceWorkingDirectory = cwd;
            }
        },
        err => {
            if (err.code !== "ENOENT") {
                throw err;
            } else {
                serviceWorkingDirectory = cwd;
            }
        }
    );
    const tag = `${importedEnv.DEVOPS_NAMESPACE}_${service}:dev`;
    return dockerBuild(dockerFile, tag, { cwd: serviceWorkingDirectory, env: importedEnv });
};

module.exports.release = async (service, { envFile = [] }) => {
    const importedEnv = await importEnv(...envFile);
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
    const versionFile = path.join(config, prodReleaseVersions, `${service}.version`);
    await fsp.stat(versionFile).catch(err => {
        if (err.code !== "ENOENT") {
            throw err;
        } else {
            throw new Error(
                `Release version not found for service ${service} (${path.join(
                    config,
                    prodReleaseVersions,
                    `${service}.version`
                )})`
            );
        }
    });
    const serviceVersion = (await fsp.readFile(versionFile, "utf8")).trim();
    const buildTag = `${importedEnv.DEVOPS_NAMESPACE}_${service}:dev`;
    const ReleaseTag = `${importedEnv.DEVOPS_NAMESPACE}_${service}:${serviceVersion}`;
    return dockerTag(buildTag, ReleaseTag);
};
