import test from "ava";
import { GithubProvider } from "../src/github-provider.mjs";
import { entryListTest } from "repository-provider-test-support";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

const config = GithubProvider.optionsFromEnvironment(process.env);
const provider = new GithubProvider(config);

test("branch entries list", async t => {
  const repository = await provider.repository(REPOSITORY_NAME);
  const branch = await repository.branch("master");
  await entryListTest(t, branch, undefined, {
    "README.md": { startsWith: "fil" },
    "tests/rollup.config.mjs": { startsWith: "import babel" },
    tests: { isCollection: true },
    "a/b/c/file.txt": { startsWith: "file content" }
  });
});

test("branch entries list with pattern", async t => {
  const repository = await provider.repository("arlac77/repository-provider");
  const branch = await repository.branch("master");

  await entryListTest(t, branch, ["**/*.mjs", "!tests/*.mjs"], {
   // "tests/repository-test.mjs": { notPresent: true },
    "src/repository.mjs": { startsWith: "import" }
  });
});

test("branch entry", async t => {
  const repository = await provider.repository(REPOSITORY_NAME);
  const branch = await repository.branch("master");

  const entry = await branch.entry("README.md");

  t.is(entry.name, "README.md");
  t.is(entry.buffer.length >= 5, true);
  t.is((await entry.getString()).substring(0, 3), "fil");
});

test("branch missing entry", async t => {
  const repository = await provider.repository(REPOSITORY_NAME);
  const branch = await repository.branch("master");
  await t.throwsAsync(async () => branch.entry("missing/file"), {
    instanceOf: Error,
    message: "404"
  });
});
