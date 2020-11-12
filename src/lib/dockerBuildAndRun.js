const { debug } = require("./log");
const { run, runBound } = require("./run");

const dockerBuild = async (dockerFile, { cwd, env = {} }) =>
    runBound(
        "docker",
        ["build"]
            .concat(
                Object.entries(env)
                    .map(([key, value]) => ["--build-arg", `${key}=${value}`])
                    .flat()
            )
            .concat(["-f", dockerFile, cwd]),
        {
            cwd,
            env
        }
    );

const dockerRun = async (dockerImage, args = [], { cwd, it, env = {} }) =>
    run(
        "docker",
        ["run", "--rm"]
            .concat(it ? ["-it"] : [])
            .concat(["-v", "/var/run/docker.sock:/var/run/docker.sock", "-v", `${cwd}/:${cwd}/`, "-w", cwd])
            .concat(
                Object.entries(env)
                    .map(([key, value]) => ["-e", `${key}=${value}`])
                    .flat()
            )
            .concat([dockerImage])
            .concat(args),
        {
            cwd,
            env
        }
    );

const extractBuiltImageTag = stdout => {
    const match = stdout.match(/\s*[Ss]uccessfully\s+built\s+([a-f\d]{12,12})/m);
    return match && match[1];
};

module.exports = async (dockerFile, args, { cwd, it = false, env = {} }) => {
    const { code, stdout } = await dockerBuild(dockerFile, { cwd, env });
    if (code !== 0) {
        debug("dockerBuild exited with a non-zero exit code - abort build");
        return { code };
    }
    const tag = extractBuiltImageTag(stdout);
    if (!tag) {
        throw new Error("Couldn't extract built image tag - abort run");
    }
    return dockerRun(tag, args, { cwd, it, env });
};
