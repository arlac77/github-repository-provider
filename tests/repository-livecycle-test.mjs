import test from "ava";

import { GithubProvider } from "../src/github-provider.mjs";

const config = GithubProvider.optionsFromEnvironment(process.env);

test("create & delete repo", async t => {
  const provider = new GithubProvider(config);
  const group = await provider.repositoryGroup("arlac77");
  const repo = await group.createRepository("test-repo-1", {
    description: "a description"
  });
  t.truthy(repo);
  
  //await repo.createBranch('master');

  t.is(repo.description, "a description");

  try {
    await repo.delete();
  } catch {}
});
