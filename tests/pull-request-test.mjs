import test from "ava";
import { pullRequestLivecycle, pullRequestList, REPOSITORY_NAME } from "repository-provider-test-support";
import GithubProvider, { GithubPullRequest } from "github-repository-provider";


test.only("pr url", async t => {
  const provider = GithubProvider.initialize(undefined, process.env);

  const repository = await provider.repository(REPOSITORY_NAME);

  const branch = await repository.defaultBranch;
  const pr = new GithubPullRequest(branch, branch, "4711", {});

  t.is(pr.url, "https://github.com/arlac77/sync-test-repository/pull/4711");
});

test("pr lifecycle", async t => {
  await pullRequestLivecycle(
    t,
    GithubProvider.initialize(undefined, process.env),
    REPOSITORY_NAME
  );
});

test("pr list", async t => {
  await pullRequestList(
    t,
    GithubProvider.initialize(undefined, process.env),
    REPOSITORY_NAME
  );
});
