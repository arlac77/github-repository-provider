import test from "ava";
import GithubProvider from "github-repository-provider";
import { entryListTest } from "repository-provider-test-support";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

const provider = GithubProvider.initialize(undefined, process.env);

test("branch entries list", async t => {
  const branch = await provider.branch(REPOSITORY_NAME);

  await entryListTest(t, branch, undefined, {
    "README.md": { startsWith: "fil" },
    "tests/rollup.config.mjs": { startsWith: "import babel" },
    tests: { isCollection: true },
    "a/b/c/file.txt": { startsWith: "file content" }
  });
});

test("branch entries list with pattern", async t => {
  const branch = await provider.branch("arlac77/repository-provider");

  await entryListTest(t, branch, ["**/*.mjs", "!tests/*.mjs"], {
   // "tests/repository-test.mjs": { notPresent: true },
    "src/repository.mjs": { startsWith: "import" }
  });
});

test("branch entry", async t => {
  const branch = await provider.branch(REPOSITORY_NAME);
  const entry = await branch.entry("README.md");

  t.is(entry.name, "README.md");
  t.is(entry.buffer.length >= 5, true);
  t.is((await entry.getString()).substring(0, 3), "fil");
});

test("branch missing entry", async t => {
  const branch = await provider.branch(REPOSITORY_NAME);

  await t.throwsAsync(async () => branch.entry("missing/file"), {
    instanceOf: Error,
    message: "404"
  });
});
