import test from "ava";
import { GithubProvider } from "../src/github-provider";

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
    t.true(pr.name.length >= 1);
    t.truthy(pr.title.match(/merge package template/));
  }
});

test("pull requests create merge", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const branches = await repository.branches();

  const newName = `pr-test-${branches.size}`;
  const branch = await repository.createBranch(newName);

  const commit = await branch.commit("message text", [
    {
      path: `README.md`,
      content: `file content #${branches.size}`
    }
  ]);

  const defaultBranch = await repository.defaultBranch;

  const pr = await defaultBranch.createPullRequest(branch, {
    body: "body",
    title: "title"
  });

  t.is(pr.title, "title");
  t.is(pr.body, "body");

  try {
    const result = await pr.merge();
    t.is(result.merged, true);
  } catch (error) {
    t.is(
      error.message.message,
      "Base branch was modified. Review and try the merge again."
    );
  }

  //await repository.deleteBranch(branch);
});
