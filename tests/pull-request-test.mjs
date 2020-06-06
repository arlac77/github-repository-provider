import test from "ava";
import { pullRequestLivecycle, pullRequestList } from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

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
