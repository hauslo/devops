const { run } = require("./run");

module.exports = async (dockerFile, tag, { cwd, env = {} }) =>
    run(
        "docker",
        ["build"]
            .concat(
                Object.entries(env)
                    .map(([key, value]) => ["--build-arg", `${key}=${value}`])
                    .flat()
            )
            .concat(["-f", dockerFile, "-t", tag, cwd]),
        {
            cwd,
            env
        }
    );
