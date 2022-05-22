import test from "ava";
import {
  entryListTest,
  REPOSITORY_NAME,
  createMessageDestination
} from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";

const messageDestination = createMessageDestination().messageDestination;
const provider = GithubProvider.initialize({ messageDestination }, process.env);
//provider.cache = new ETagFileCache(new URL("cache.json", import.meta.url));

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

  async function read() {
    return branch.entry("README.md");
  }

  let i = 0;

  for (const entry of await Promise.all([read(), read(), read()])) {
    t.is(entry.name, "README.md", `name #${i}`);
    //  t.is(entry.mode, 0o100644, `mode #${i}`);
    t.is(entry.buffer.length >= 5, true, `length #${i}`);
    t.is((await entry.string).substring(0, 3), "fil", `content #${i}`);
    i++;
  }
});

test("branch missing entry", async t => {
  const branch = await provider.branch(REPOSITORY_NAME);

  await t.throwsAsync(async () => branch.entry("missing/file"), {
    instanceOf: Error
    //  message: "404"
  });
});

test("branch maybeEntry", async t => {
  const branch = await provider.branch(REPOSITORY_NAME);
  t.is(await branch.maybeEntry("missing/file"), undefined);
  t.is((await branch.maybeEntry("README.md")).name, "README.md");
});
