import test from "ava";
import { pullRequestLivecycle, pullRequestList, REPOSITORY_NAME, createMessageDestination } from "repository-provider-test-support";
import { GithubProvider, GithubPullRequest } from "github-repository-provider";

const messageDestination = createMessageDestination().messageDestination;
const provider = GithubProvider.initialize({ messageDestination }, process.env);

test("pr url + api", async t => {
  const repository = await provider.repository(REPOSITORY_NAME);

  const branch = await repository.defaultBranch;
  const pr = new GithubPullRequest(branch, branch, "4711", {});

  t.is(pr.url, "https://github.com/arlac77/sync-test-repository/pull/4711");
  t.is(pr.api, "https://api.github.com/repos/arlac77/sync-test-repository/pulls/4711");
});

test("pr lifecycle", async t => {
  await pullRequestLivecycle(
    t,
    provider,
    REPOSITORY_NAME
  );
});

test("pr list", async t => {
  await pullRequestList(
    t,
    provider,
    REPOSITORY_NAME
  );
});
