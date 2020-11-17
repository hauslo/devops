const yargs = require("yargs");

const { version, name } = require("../config");

const cli = yargs
    .version(version)
    .scriptName(name)
    .usage("Usage: $0 help")
    .showHelpOnFail(false)
    .exitProcess(false)
    .help(false)
    .fail(() => {})
    .option("it", {
        describe: `Runs the command in interactive mode`,
        type: "boolean"
    })
    .coerce("it")
    .option("env-file", {
        alias: "e",
        describe: `Sources environment variables from a dotenv file`,
        type: "string"
    })
    .coerce("env-file", files => (typeof files === "string" ? [files] : files))
    .command("version", `Prints the version number (=${version})`)
    .command("help", `Prints this documentation`)
    .command(
        "debug",
        `Dumps the parsed configuration (environment variables, detected services and their commands, etc)`
    )
    .command("start <deployment>", "Starts a local deployment for development/testing purpose")
    .command("stop <deployment>", "Stops the local deployment")
    .command("test <suite>", "Runs a test suite against the local deployment")
    .command("build <service>", "Builds the service container for deployment")
    .command("release <service>", "Versions a build and releases it to the container registry")
    .command("provision <infrastructure>", "Provision an infrastructure with terraform")
    .command("configure <infrastructure> <playbook>", "Configure an infrastructure with ansible", command =>
        command
            .option("identity-file", {
                describe: `SSH identity file for ansible`,
                type: "string"
            })
            .option("inventory-file", {
                describe: `Ansible inventory file`,
                type: "string"
            })
    );

module.exports = cmdLine => {
    const options = cmdLine ? cli.parse([...cmdLine]) : cli.parse();
    const [command, ...args] = options._;
    delete options.$0;
    delete options._;

    if (!command) {
        throw new Error(`Command required`);
    } else {
        return {
            command,
            options,
            args
        };
    }
};
module.exports.help = () => cli.showHelp();
