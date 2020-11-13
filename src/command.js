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
    prodReleaseVersions,
    prodInfrastructureConfigs
} = require("./config");
const { import: importEnv } = require("./env");
const ensureVersionCompatibility = require("./lib/ensureVersionCompatibility");
const docker = require("./lib/docker");

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

    return docker.compose(composeFile, ["up"], { it, env: importedEnv });
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

    return docker.compose(composeFile, ["down"], { it, env: importedEnv });
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

    return docker.buildAndRun(dockerFile, args, { it, env: importedEnv });
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

    return docker.buildAndRun(dockerFile, args, {
        root: cwd,
        buildDir: serviceWorkingDirectory,
        runDir: serviceWorkingDirectory,
        it,
        env: importedEnv
    });
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
    return docker.build(dockerFile, tag, { buildDir: serviceWorkingDirectory, env: importedEnv });
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
    return docker.tag(buildTag, ReleaseTag);
};

module.exports.provision = async (infrastructure, args = [], { envFile = [], it = true }) => {
    const importedEnv = await importEnv(...envFile);
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
    const infrastructureConfig = path.join(config, prodInfrastructureConfigs, infrastructure);
    await fsp.stat(infrastructureConfig).catch(err => {
        if (err.code !== "ENOENT") {
            throw err;
        } else {
            throw new Error(
                `Infrastructure ${infrastructure} not found (${path.join(
                    config,
                    prodInfrastructureConfigs,
                    infrastructure
                )})`
            );
        }
    });

    return docker.run("hashicorp/terraform:light", args, {
        root: cwd,
        runDir: infrastructureConfig,
        it,
        env: importedEnv
    });
};
