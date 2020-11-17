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
    prodProvisionConfigs,
    prodConfigureConfigs
} = require("./config");
const { import: importEnv } = require("./env");
const ensureVersionCompatibility = require("./lib/ensureVersionCompatibility");
const docker = require("./lib/docker");
const { log } = require("./lib/log");

module.exports.version = () => version;

module.exports.env = async ({ envFile = [] }) => {
    const importedEnv = await importEnv(...envFile);
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
    return importedEnv;
};

module.exports.start = async (deployment, { envFile = [], it = false }) => {
    const importedEnv = await importEnv(...envFile);
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
    const composeFile = path.join(cwd, config, devDeployments, `${deployment}.yml`);
    await fsp.stat(composeFile).catch(err => {
        if (err.code !== "ENOENT") {
            throw err;
        } else {
            throw new Error(
                `Deployment "${deployment}" not found (${path.join(config, devDeployments, `${deployment}.yml`)})`
            );
        }
    });

    return docker.compose(composeFile, "up", { it, env: importedEnv });
};

module.exports.stop = async (deployment, { envFile = [], it = false }) => {
    const importedEnv = await importEnv(...envFile);
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
    const composeFile = path.join(cwd, config, devDeployments, `${deployment}.yml`);
    await fsp.stat(composeFile).catch(err => {
        if (err.code !== "ENOENT") {
            throw err;
        } else {
            throw new Error(
                `Deployment "${deployment}" not found (${path.join(config, devDeployments, `${deployment}.yml`)})`
            );
        }
    });

    return docker.compose(composeFile, "down", { it, env: importedEnv });
};

module.exports.test = async (suite, args = [], { envFile = [], it = true }) => {
    const importedEnv = await importEnv(...envFile);
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
    const dockerFile = path.join(cwd, config, devTestSuites, `${suite}.Dockerfile`);
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
    const dockerFile = path.join(cwd, config, devScripts, service, `${script}.Dockerfile`);
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
    const dockerFile = path.join(cwd, config, prodBuildScripts, `${service}.Dockerfile`);
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
    const { DEVOPS_NAMESPACE: namespace } = importedEnv;
    if (!namespace) {
        throw new Error("Missing required environment variable DEVOPS_NAMESPACE - abort release");
    }
    const tag = `${namespace}_${service}:dev`;
    return docker.build(dockerFile, tag, { buildDir: serviceWorkingDirectory, env: importedEnv });
};

module.exports.release = async (service, { envFile = [] }) => {
    const importedEnv = await importEnv(...envFile);
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
    const versionFile = path.join(cwd, config, prodReleaseVersions, `${service}.version`);
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

    const { DEVOPS_NAMESPACE: namespace } = importedEnv;
    if (!namespace) {
        throw new Error("Missing required environment variable DEVOPS_NAMESPACE - abort release");
    }

    const buildTag = `${namespace}_${service}:dev`;
    const releaseTag = `${namespace}_${service}:${serviceVersion}`;
    let { code } = await docker.tag(buildTag, releaseTag);
    if (code !== 0) {
        log("docker tag exited with a non-zero exit code - abort run");
        return { code };
    }

    const {
        DEVOPS_REGISTRY_LOGIN_URL: registryLoginUrl,
        DEVOPS_REGISTRY_URL: registryUrl,
        DEVOPS_REGISTRY_USER: registryUser,
        DEVOPS_REGISTRY_PASSWORD: registryPassword
    } = importedEnv;
    if (!registryLoginUrl) {
        log("Environment variable DEVOPS_REGISTRY_LOGIN_URL not found - abort push");
        return { code: 0 };
    }

    code = (await docker.login(registryLoginUrl, registryUser, registryPassword)).code;
    if (code !== 0) {
        log("docker login exited with a non-zero exit code - abort push");
        return { code };
    }

    const registryReleaseTag = `${registryUrl}/${releaseTag}`;
    code = (await docker.tag(releaseTag, registryReleaseTag)).code;
    if (code !== 0) {
        log("docker tag exited with a non-zero exit code - abort push");
        return { code };
    }

    return docker.push(registryReleaseTag);
};

module.exports.provision = async (infrastructure, args = [], { envFile = [], it = true }) => {
    const importedEnv = await importEnv(...envFile);
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
    const infrastructureConfig = path.join(cwd, config, prodProvisionConfigs, infrastructure);
    await fsp.stat(infrastructureConfig).catch(err => {
        if (err.code !== "ENOENT") {
            throw err;
        } else {
            throw new Error(
                `Infrastructure ${infrastructure} not found (${path.join(
                    config,
                    prodProvisionConfigs,
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

module.exports.configure = async (infrastructure, playbook, args = [], { envFile = [], it = true }) => {
    const importedEnv = await importEnv(...envFile);
    ensureVersionCompatibility(importedEnv.DEVOPS_VERSION);
    const playbookFile = path.join(cwd, config, prodConfigureConfigs, infrastructure, `${playbook}.yml`);
    await fsp.stat(playbookFile).catch(err => {
        if (err.code !== "ENOENT") {
            throw err;
        } else {
            throw new Error(
                `Playbook ${playbook} not found (${path.join(
                    config,
                    prodConfigureConfigs,
                    infrastructure,
                    `${playbook}.yml`
                )})`
            );
        }
    });

    const { DEVOPS_ANSIBLE_IDENTITY_FILE: identityFile } = importedEnv;

    if (!args.includes("--private-key") && !args.includes("--key-file") && identityFile) {
        args.unshift(identityFile);
        args.unshift("--private-key");
    }

    if (!args.includes("-i") && !args.includes("--inventory") && !args.includes("--inventory-file")) {
        args.unshift(path.join(config, prodConfigureConfigs, infrastructure, `inventory`));
        args.unshift("-i");
    }

    args.push(playbookFile);
    // return docker.run("philm/ansible_playbook", args, {
    return docker.run("hauslo/ansible-playbook", args, {
        root: cwd,
        it,
        env: importedEnv
    });
};
