import test from "ava";
import { StringContentEntry } from "content-entry";
import GithubProvider from "github-repository-provider";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

const provider = GithubProvider.initialize(undefined, process.env);

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

  const newName = `test-create-branch-${n}`;
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
  const newName = `test-commit-${n}`;
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
  const newName = `test-commit-dir-${n}`;
  const branch = await repository.createBranch(newName);
  try {
    const commit = await branch.commit("message text", [
      new StringContentEntry(`directory-${n}/a/b/c/README.md`, `file content #${n}`)
    ]);

    t.is(commit.ref, `refs/heads/${newName}`);
  } finally {
    await repository.deleteBranch(newName);
  }
});
