import test from "ava";
import GithubProvider from "github-repository-provider";
import { entryListTest, REPOSITORY_NAME } from "repository-provider-test-support";

const provider = GithubProvider.initialize(undefined, process.env);

test("branch entries list", async t => {
  const branch = await provider.branch(REPOSITORY_NAME);

  await entryListTest(t, branch, undefined, {
    "README.md": { startsWith: "fil", mode: 0o100644 },
    "tests/rollup.config.mjs": { startsWith: "import babel", mode: 0o100644 },
    tests: { isCollection: true },
    "a/b/c/file.txt": { startsWith: "file content", mode: 0o100644 }
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
 // t.is(entry.mode, 0o100644);
  t.is(entry.buffer.length >= 5, true);
  t.is((await entry.string).substring(0, 3), "fil");
});

test("branch missing entry", async t => {
  const branch = await provider.branch(REPOSITORY_NAME);

  await t.throwsAsync(async () => branch.entry("missing/file"), {
    instanceOf: Error,
  //  message: "404"
  });
});
