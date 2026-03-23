import * as assert from "node:assert";
import { snippetFormatter } from "../snippet/snippetFormatter.js";
import { getFixture, getFixtures } from "./testUtils.js";

suite("Snippet formatter", () => {
    for (const fixture of getFixtures("snippetFixtures")) {
        test(fixture.title, function () {
            const { input, expected } = getFixture(fixture.file);
            const actual = snippetFormatter(input);
            assert.equal(actual, expected);
        });
    }
});
