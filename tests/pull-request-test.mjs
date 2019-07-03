import test from "ava";
import { StringContentEntry } from "content-entry";
import { GithubProvider } from "../src/github-provider.mjs";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

const config = GithubProvider.optionsFromEnvironment(process.env);

test("pull requests list", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    REPOSITORY_NAME + "#some-other-branch"
  );

  const prs = await repository.pullRequests();

  if (prs.size === 0) {
    t.is(prs.size, 0);
  } else {
    const pr = prs.values().next().value;
    t.is(pr.destination, await repository.defaultBranch);
    t.true(pr.name.length >= 1);
    t.truthy(pr.title.match(/merge package template/));
    t.is(pr.state, "CLOSED");
    t.false(pr.merged);
    t.false(pr.locked);
  }
});

test("pull requests create & merge", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);

  let n = 0;
  for await(const branch of repository.branches()) {
    n++;
  }

  const newName = `pr-test-${n}`;
  const branch = await repository.createBranch(newName);

  const commit = await branch.commit("message text", [
    new StringContentEntry("README.md", `file content #${n}`)
  ]);

  const defaultBranch = await repository.defaultBranch;

  let pr = await defaultBranch.createPullRequest(branch, {
    body: "body",
    title: "title"
  });

  t.is(pr.title, "title");
  t.is(pr.body, "body");
  t.true(pr.id !== undefined);
  t.is(pr.locked, false);
  t.is(pr.merged, false);

  try {
    pr = await pr.merge();
    t.is(pr.merged, true);
    t.is(pr.title, "title");
    t.is(pr.body, "body");
    t.true(pr.id !== undefined);
    t.is(pr.locked, false);
  } catch (error) {
    console.log(JSON.stringify(error));
    t.is(
      error.message,
      "Base branch was modified. Review and try the merge again."
    );
  }

  await pr.delete();
  await repository.deleteBranch(newName);
});
