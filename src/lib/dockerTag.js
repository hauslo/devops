const { run } = require("./run");

module.exports = async (dockerImage, tag) => run("docker", ["tag", dockerImage, tag]);
