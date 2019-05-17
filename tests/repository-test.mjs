import test from "ava";
import { GithubProvider } from "../src/github-provider.mjs";
import { GithubBranch } from "../src/github-branch.mjs";
import { GithubRepository } from "../src/github-repository.mjs";
import { StringContentEntry } from "content-entry";

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
      new StringContentEntry("README.md", `file content #${branches.size}`)
    ]);

    t.is(commit.ref, `refs/heads/${newName}`);
  } finally {
    await repository.deleteBranch(newName);
  }
});
