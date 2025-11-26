import test from "ava";
import { filterWritable } from "pacc";
import {
  REPOSITORY_NAME,
  createMessageDestination
} from "repository-provider-test-support";
import { StringContentEntry } from "content-entry";
import GithubProvider from "github-repository-provider";

const messageDestination = createMessageDestination().messageDestination;
const provider = GithubProvider.initialize({ messageDestination }, process.env);

test("repository writableAttributes", async t => {
  const repository = await provider.repository(REPOSITORY_NAME);

  t.is(repository.api,"https://api.github.com/repos/arlac77/sync-test-repository");

  t.deepEqual(repository.toJSON(filterWritable), {
    description: "test template-tools",
    archived: false,
    allow_auto_merge: false,
    allow_merge_commit: false,
    allow_rebase_merge: false,
    allow_squash_merge: false,
    delete_branch_on_merge: false,
    is_template: false,
    auto_init: false,
    disabled: false,
    locked: false,
    default_branch: "master",
    name: "sync-test-repository",
    private: false,
    homepage: 'https://github.com/arlac77/sync-test-repository#readme',
   // issuesURL: "https://github.com/arlac77/sync-test-repository/issues",
   // cloneURL: "git+https://github.com/arlac77/sync-test-repository.git",
   // api: "https://api.github.com/repos/arlac77/sync-test-repository",
   // id: 253911783,
   // language: "JavaScript",
   // fork: false,
   // size: 477
  });
});

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
      new StringContentEntry("README.md", undefined, `file content #${n}`)
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
      new StringContentEntry(
        `directory-${n}/a/b/c/README.md`,
        undefined,
        `file content #${n}`
      )
    ]);
    t.is(commit.ref, `refs/heads/${newName}`);
  } finally {
    await repository.deleteBranch(newName);
  }
});

test("ref failure", async t => {
  const repository = await provider.repository(REPOSITORY_NAME);

  try {
    await repository.refId("invalid ref id ---:dfddd");
    t.fail("no way");
  } catch (e) {
    t.truthy(e.message.match(/No refId for/));
  }
});
