import test from "ava";

import { GithubProvider } from "../src/github-provider.mjs";

const config = GithubProvider.optionsFromEnvironment(process.env);
const provider = new GithubProvider(config);

test("create & delete repo", async t => {
  const group = await provider.repositoryGroup("arlac77");
  const repo = await group.createRepository("test-repo-1", {
    description: "a description",
    auto_init: true
  });
  t.truthy(repo);
  
  t.is(repo.description, "a description");

  try {
    await repo.delete();
  } catch {}
});
