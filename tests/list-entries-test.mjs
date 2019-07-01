import test from "ava";
import { GithubProvider } from "../src/github-provider.mjs";
import { isBuffer } from "util";


const REPOSITORY_NAME = "arlac77/sync-test-repository";

const config = GithubProvider.optionsFromEnvironment(process.env);

const entryFixtures = {
  "README.md" : { startsWith: "fil" },
  "tests/rollup.config.js" : { startsWith: "import babel" },
  "tests" : { isCollection: true }
};

test("list entries", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const branch = await repository.branch("master");

  t.plan(Object.keys(entryFixtures).length + 1);

  for await (const entry of branch.entries()) {
    const ef = entryFixtures[entry.name];

    if(ef !== undefined) {
      if(ef.isCollection) {
        t.true(entry.isCollection);
      }
      else {
        t.true((await entry.getString()).startsWith(ef.startsWith));
      }
    }
  }
});

test("list entries with pattern", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    "arlac77/repository-provider"
  );
  const branch = await repository.branch("master");

  const entries = {};
  for await (const entry of branch.entries(["**/*.mjs",'!tests/*.mjs'])) {
    entries[entry.name] = entry;
  }

  t.is(entries["tests/repository-test.mjs"], undefined);
  t.is(entries["src/repository.mjs"].name, "src/repository.mjs");
});

test("branch entry", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const branch = await repository.branch("master");

  const entry = await branch.entry("README.md");

  t.is(entry.name, "README.md");
  t.is(entry.buffer.length >= 5, true);
  t.is((await entry.getString()).substring(0, 3), "fil");
});

test("branch missing entry", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const branch = await repository.branch("master");
  await t.throwsAsync(async () => branch.entry("missing/file"), {
    instanceOf: Error,
    message: "404"
  });
});
