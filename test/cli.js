/* eslint-env mocha */

const chai = require("chai");
chai.use(require("chai-as-promised"));

const { assert } = chai;

const cli = require("../src/cli");

describe("src/cli", () => {
    it("should return an object with the signature { command: string, args: array<string>, options: object }", () => {
        assert.deepEqual(
            {
                command: "command",
                args: ["arg-1", "arg-2", "--non-option"],
                options: {
                    "option-1": true,
                    option1: true,
                    "option-2": true,
                    option2: true
                }
            },
            cli(["command", "arg-1", "arg-2", "--option-1", "--option-2", "--", "--non-option"])
        );
    });
});
