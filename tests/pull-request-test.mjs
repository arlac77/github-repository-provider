import test from "ava";
import { pullRequestLivecycle } from "repository-provider-test-support";
import { GithubProvider } from "../src/github-provider.mjs";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

test("pull requests list", async t => {
  const provider = GithubProvider.initialize(undefined, process.env);
  const repository = await provider.repository(REPOSITORY_NAME);

  for await (const pr of repository.pullRequests()) {
    t.is(pr.destination, await repository.defaultBranch);
    t.true(pr.number !== undefined);
    t.true(pr.title.length >= 1);
    // t.truthy(pr.title.match(/merge package template/));
    t.is(pr.state, ["MERGED", "OPEN"].find(s => s === pr.state));
    //t.false(pr.merged);
    t.false(pr.locked);
  }

  t.true(repository !== undefined);
});

test.only("pull requests create decline", async t => {
  await pullRequestLivecycle(
    t,
    GithubProvider.initialize(undefined, process.env),
    REPOSITORY_NAME
  );
});
