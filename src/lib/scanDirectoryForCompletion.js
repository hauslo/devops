const fsp = require("fs").promises;

module.exports = async dir =>
    (await fsp.readdir(dir))
        .catch(err => {
            if (err.code === "ENOENT") {
                return [];
            } else {
                throw err;
            }
        })
        .map(files => files.split(".", 1).shift());
