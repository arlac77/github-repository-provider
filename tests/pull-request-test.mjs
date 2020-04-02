import test from "ava";
import { pullRequestLivecycle, pullRequestList } from "repository-provider-test-support";
import { GithubProvider } from "../src/github-provider.mjs";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

test.serial("pr lifecycle", async t => {
  await pullRequestLivecycle(
    t,
    GithubProvider.initialize(undefined, process.env),
    REPOSITORY_NAME
  );
});

test.serial("pr list", async t => {
  await pullRequestList(
    t,
    GithubProvider.initialize(undefined, process.env),
    REPOSITORY_NAME
  );
});
