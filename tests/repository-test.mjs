import test from "ava";
import { GithubProvider } from "../src/github-provider.mjs";
import { StringContentEntry } from "content-entry";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

const config = GithubProvider.optionsFromEnvironment(process.env);
const provider = new GithubProvider(config);

test("repository refId", async t => {
  const repository = await provider.repository(REPOSITORY_NAME);

  t.is((await repository.refId("refs/heads/master")).length, 40);
});

test("create branch", async t => {
  const repository = await provider.repository(REPOSITORY_NAME);

  let n = 0;
  for await (const branch of repository.branches()) {
    n++;
  }

  const newName = `test-${n}`;
  const branch = await repository.createBranch(newName);

  t.is(branch.name, newName);

  const branch2 = await repository.createBranch(newName);
  t.deepEqual(branch, branch2);

  await repository.deleteBranch(newName);
  t.is(await repository.branch(newName), undefined);
});

test("create commit", async t => {
  const repository = await provider.repository(REPOSITORY_NAME);

  let n = 0;
  for await (const branch of repository.branches()) {
    n++;
  }
  const newName = `commit-test-${n}`;
  const branch = await repository.createBranch(newName);
  try {
    const commit = await branch.commit("message text", [
      new StringContentEntry("README.md", `file content #${n}`)
    ]);

    t.is(commit.ref, `refs/heads/${newName}`);
  } finally {
    await repository.deleteBranch(newName);
  }
});

test("create commit into new directory", async t => {
  const repository = await provider.repository(REPOSITORY_NAME);

  let n = 0;
  for await (const branch of repository.branches()) {
    n++;
  }
  const newName = `commit-test-${n}`;
  const branch = await repository.createBranch(newName);
  try {
    const commit = await branch.commit("message text", [
      new StringContentEntry(`directory-${n}/README.md`, `file content #${n}`)
    ]);

    t.is(commit.ref, `refs/heads/${newName}`);
  } finally {
    await repository.deleteBranch(newName);
  }
});
