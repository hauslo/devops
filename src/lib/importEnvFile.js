const fsp = require("fs").promises;
const dotenv = require("dotenv");

module.exports = async (...files) =>
    Promise.all(
        files.map(file =>
            fsp
                .readFile(file, "utf8")
                .catch(err => {
                    if (err.code === "ENOENT") {
                        return {};
                    } else {
                        throw err;
                    }
                })
                .then(content => {
                    return dotenv.parse(content);
                })
        )
    ).then(envs => envs.reduce((merge, env) => ({ ...env, ...merge }), {}));
