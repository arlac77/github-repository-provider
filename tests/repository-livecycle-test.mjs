import test from "ava";

import { GithubProvider } from "../src/github-provider.mjs";

const config = GithubProvider.optionsFromEnvironment(process.env);
const provider = new GithubProvider(config);

test.skip("create & delete repo", async t => {
  const group = await provider.repositoryGroup("arlac77");

  const repoName = "test-repo-1";

  try {
    const repo = await group.repository(repoName);
    if(repo) {
      console.log(repo);
      await repo.delete();
    }
  } catch (e) {
    console.log(e);
  }

  const repo = await group.createRepository(repoName, {
    description: "a description",
    auto_init: true
  });
  t.truthy(repo);

  t.is(repo.description, "a description");

  try {
    await repo.delete();
  } catch {}
});
