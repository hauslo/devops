const { spawn } = require("child_process");
const { debug } = require("./log")("run");

const run = async (command, args, { cwd, env = {} } = {}) =>
    new Promise(resolve => {
        debug(`Running (cwd=${cwd}) ${command} ${args.join(" ")}`);
        const subprocess = spawn(command, args, {
            cwd,
            env,
            stdio: "inherit"
        });

        debug(`Spawned process ${subprocess.pid}`);
        subprocess.on("exit", code => resolve({ code }));
    });

const runBound = async (command, args, { cwd, env = {} } = {}) =>
    new Promise(resolve => {
        debug(`Running (bound,cwd=${cwd}) ${command} ${args.join(" ")}`);
        const subprocess = spawn(command, args, {
            cwd,
            env,
            stdio: [process.stdin, "pipe", process.stderr]
        });
        const stdout = [];
        subprocess.stdout.on("data", chunk => {
            // eslint-disable-next-line no-console
            console.log(chunk.toString());
            stdout.push(chunk);
        });

        debug(`Spawned process ${subprocess.pid}`);
        subprocess.on("exit", code => resolve({ code, stdout: Buffer.concat(stdout).toString() }));
    });

module.exports.run = run;
module.exports.runBound = runBound;
