/* eslint-disable no-console */
const cli = require("./cli");
const command = require("./command");
const { log, debug } = require("./lib/log");

const commandLine = async line => {
    let exit = 0;
    try {
        const parsed = await cli(line);
        if (commandLine[parsed.command]) {
            exit = await Promise.resolve(commandLine[parsed.command](parsed.options, parsed.args));
        } else {
            exit = await commandLine.dev(parsed.command, parsed.options, parsed.args);
        }
    } catch (err) {
        exit = 1;
        log(err.message);
        debug(err);
        cli.help();
    }

    return exit;
};

commandLine.completion = () => {
    return 0;
};
commandLine.version = () => {
    console.log(command.version());
    return 0;
};
commandLine.help = () => {
    cli.help();
    return 0;
};
commandLine.debug = async ({ envFile }) => {
    const env = await command.env({ envFile });
    console.log(
        Object.entries(env)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n")
    );
    return 0;
};
commandLine.start = async ({ envFile, it, deployment }) => {
    return command.start(deployment, { envFile, it });
};
commandLine.stop = async ({ envFile, it, deployment }) => {
    return command.stop(deployment, { envFile, it });
};
commandLine.test = async ({ envFile, it, suite }, args) => {
    return command.test(suite, args, { envFile, it });
};
commandLine.dev = async (service, { envFile, it }, [script, ...args]) => {
    return command.dev(service, script, args, { envFile, it });
};
commandLine.build = async ({ envFile, service }) => {
    return command.build(service, { envFile });
};
commandLine.release = async ({ envFile, service }) => {
    return command.release(service, { envFile });
};

module.exports = commandLine;
