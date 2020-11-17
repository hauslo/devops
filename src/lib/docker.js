const path = require("path");

const { run, runBound } = require("./run");
const { cwd } = require("../config");
const { log } = require("./log")("docker");

const docker = {};

docker.build = (file, tag, { buildDir = cwd, env = {}, args = [], stdout = false } = {}) =>
    (stdout ? runBound : run)(
        "docker",
        ["build"]
            .concat(args)
            .concat(
                Object.entries(env)
                    .map(([key, value]) => ["--build-arg", `${key}=${value}`])
                    .flat()
            )
            // .concat(["--no-cache"])
            .concat(["-f", path.resolve(cwd, file)])
            .concat(tag ? ["-t", tag] : [])
            .concat([buildDir]),
        {
            cwd: buildDir,
            env
        }
    );

docker.run = async (
    image,
    command = [],
    { root = cwd, runDir = root, it = false, env = {}, args = [], stdout = false } = {}
) =>
    (stdout ? runBound : run)(
        "docker",
        ["run", "--rm"]
            .concat(args)
            .concat(it ? ["-it"] : [])
            .concat(["-v", "/var/run/docker.sock:/var/run/docker.sock", "-v", `${root}/:${root}/`, "-w", runDir])
            .concat(
                Object.entries(env)
                    .map(([key, value]) => ["-e", `${key}=${value}`])
                    .flat()
            )
            .concat([image])
            .concat(command),
        {
            cwd: runDir,
            env
        }
    );

docker.buildAndRun = async (
    file,
    command = [],
    {
        root = cwd,
        runDir = root,
        buildDir = root,
        it = false,
        env = {},
        runArgs = [],
        buildArgs = [],
        stdout = false
    } = {}
) => {
    const { code, stdout: buildStdout } = await docker.build(file, undefined, {
        buildDir,
        env,
        args: buildArgs,
        stdout: true
    });
    if (code !== 0) {
        log("build exited with a non-zero exit code - abort run");
        return { code };
    }
    const tagMatch = buildStdout.match(/\s*[Ss]uccessfully\s+built\s+([a-f\d]{12,12})/m);
    const tag = tagMatch && tagMatch[1];
    if (!tag) {
        throw new Error("couldn't extract image tag from build output - abort run");
    }
    return docker.run(tag, command, {
        root,
        runDir,
        it,
        env,
        args: runArgs,
        stdout
    });
};

docker.compose = async (
    file,
    command = "up",
    { root = cwd, composeDir = root, it = false, env = {}, args = [], stdout = false } = {}
) =>
    (stdout ? runBound : run)(
        "docker",
        ["run", "--rm"]
            .concat(it ? ["-it"] : [])
            .concat(["-v", "/var/run/docker.sock:/var/run/docker.sock", "-v", `${root}/:${root}/`, "-w", composeDir])
            .concat(
                Object.entries(env)
                    .map(([key, value]) => ["-e", `${key}=${value}`])
                    .flat()
            )
            .concat(["docker/compose", "-f", path.resolve(cwd, file)])
            .concat([command])
            .concat(args)
            .concat(command === "up" && !it ? ["-d"] : []),
        {
            cwd: composeDir,
            env
        }
    );

docker.tag = (image, tag, { stdout = false } = {}) => (stdout ? runBound : run)("docker", ["tag", image, tag]);

docker.login = (registry, user, password, { stdout = false } = {}) =>
    (stdout ? runBound : run)("docker", ["login", "-u", user, "-p", password, registry]);

docker.push = (image, { stdout = false } = {}) => {
    return (stdout ? runBound : run)("docker", ["push", `${image}`]);
};

module.exports = docker;
