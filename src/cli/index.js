const yargs = require("yargs");
const scanConfigForCompletion = require("../lib/scanConfigForCompletion");

const { version } = require("../config");

const cli = yargs
    .version(version)
    .usage("Usage: $0 help")
    .showHelpOnFail(false)
    .exitProcess(false)
    .help(false)
    .fail(() => {})
    .demandCommand(1)
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
    .completion("completion", async () =>
        scanConfigForCompletion().then(completion => [
            ...completion,
            "version",
            "debug",
            "start",
            "stop",
            "test",
            "build",
            "release",
            "provision",
            "provision-cluster",
            "deploy",
            "backup",
            "restore"
        ])
    )
    .command("version", `Prints the version number (=${version})`)
    .command("help", `Prints this documentation`)
    .command(
        "debug",
        `Dumps the parsed configuration (environment variables, detected services and their commands, etc)`
    )
    .command("start <deployment>", "Starts a local deployment")
    .command("stop <deployment>", "Stops the current local deployment")
    .command("test <suite>", "Runs a test suite against the local deployment")
    .command("build <service>", "Builds the service container")
    .command("release <service>", "Releases the build service container as a new version");
/*
    .command("provision <infrastructure>", "Provision an infrastructure")
    .command("provision-cluster <infrastructure> <cluster>", "Creates/Updates a swarm cluster")
    .command("deploy <cluster> <stack>", "Deploys a service stack to a cluster")
    .command("backup <cluster> <stack> <service>", "Backups a deployed service")
    .command("restore <cluster> <stack> <service>", "Restores a deployed service")
*/

module.exports = cmdLine => {
    const options = cmdLine ? cli.parse([...cmdLine]) : cli.argv;
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
