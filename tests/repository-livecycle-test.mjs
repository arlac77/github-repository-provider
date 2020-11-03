import test from "ava";

import GithubProvider from "github-repository-provider";

const config = GithubProvider.optionsFromEnvironment(process.env);
const provider = new GithubProvider(config);

test("create & delete repo", async t => {
  const group = await provider.repositoryGroup("arlac77");

  t.log("group found");
 
  const repoName = "test-repo-1";

  let repo = await group.repository(repoName);
  if (repo) {
    await repo.delete();
  }

  t.log("repo cleared");

  repo = await group.createRepository(repoName, {
    description: "a description",
    auto_init: true
  });

  t.log("repo created");

  t.is(repo.name, repoName);
  t.is(repo.description, "a description");

  try {
    await repo.delete();
  } catch(e) {
    t.log(e);
  }
});
