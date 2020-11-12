const { run } = require("./run");

module.exports = async (dockerComposeFile, command = "up", { cwd, it = false, env = {} }) => {
    return run(
        "docker",
        ["run", "--rm"]
            .concat(it ? ["-it"] : [])
            .concat(["-v", "/var/run/docker.sock:/var/run/docker.sock", "-v", `${cwd}/:${cwd}/`, "-w", cwd])
            .concat(
                Object.entries(env)
                    .map(([key, value]) => ["-e", `${key}=${value}`])
                    .flat()
            )
            .concat(["docker/compose", "-f", dockerComposeFile, command])
            .concat(it ? ["-d"] : []),
        {
            cwd,
            env
        }
    );
};
