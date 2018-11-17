import test from "ava";
import { Content } from "repository-provider";
import { GithubProvider } from "../src/github-provider";
import { GithubBranch } from "../src/github-branch";
import { GithubRepository } from "../src/github-repository";

const REPOSITORY_NAME = "arlac77/sync-test-repository";
const REPOSITORY_OWNER = "arlac77";

const config = GithubProvider.optionsFromEnvironment(process.env);

test("repository refId", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);

  t.is((await repository.refId("refs/heads/master")).length, 40);
});

test("create branch", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const branches = await repository.branches();

  //t.is(branches.get('master').name, 'master');

  const newName = `test-${branches.size}`;
  const branch = await repository.createBranch(newName);

  t.is(branch.name, newName);

  const branch2 = await repository.createBranch(newName);
  t.deepEqual(branch, branch2);

  await repository.deleteBranch(newName);
  t.is(branches.get(newName), undefined);
});

test("create commit", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);

  const branches = await repository.branches();

  const newName = `commit-test-${branches.size}`;
  const branch = await repository.createBranch(newName);
  try {
    const commit = await branch.commit("message text", [
      new Content("README.md", `file content #${branches.size}`)
    ]);

    t.is(commit.ref, `refs/heads/${newName}`);
  } finally {
    await repository.deleteBranch(newName);
  }
});

test("list files", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const branch = await repository.branch("master");

  const files = [];
  for await (const entry of branch.list()) {
    files.push(entry);
  }

  t.is(files.find(f => f.name === "README.md").isFile, true);
  t.is(files.find(f => f.name === "tests").isDirectory, true);
  t.is(files.find(f => f.name === "tests/rollup.config.js").isFile, true);
});

test("list files with pattern", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    "arlac77/repository-provider" /*REPOSITORY_NAME*/
  );
  const branch = await repository.branch("master");

  const files = [];
  for await (const entry of branch.list(["**/*.json"])) {
    files.push(entry);
  }

  t.is(files[0].name, "package.json");
});

test("content", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const branch = await repository.branch("master");

  const content = await branch.content("README.md");

  t.is(content.content.length >= 5, true);
});

test("missing content", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const branch = await repository.branch("master");
  await t.throwsAsync(async () => branch.content("missing/file"), {
    instanceOf: Error,
    message: "Not Found"
  });
});
