import test from "ava";
import { GithubProvider } from "../src/github-provider";

const REPOSITORY_OWNER = "arlac77";

const config = GithubProvider.optionsFromEnvironment(process.env);

test("owner with auth", async t => {
  const provider = new GithubProvider(config);
  const owner = await provider.repositoryGroup(REPOSITORY_OWNER);
  t.is(owner.name, REPOSITORY_OWNER);

  const repo = await owner.repository("github-repository-provider");
  t.is(repo.name, "github-repository-provider");
  t.is(repo.fullName, "arlac77/github-repository-provider");
  //  t.is(repo.description, "repository provider for github");
  t.true(owner._repositories.size > 25);
});

test("list repositories", async t => {
  const provider = new GithubProvider(config);
  const owner = await provider.repositoryGroup(REPOSITORY_OWNER);
  t.is(owner.name, REPOSITORY_OWNER);

  const reps = {};
  for await (const r of owner.repositories("npm-template*")) {
    reps[r.name] = r;
  }

  t.true(Object.keys(reps).length >= 2);
  t.truthy(reps['npm-template-sync']);
  t.truthy(reps['npm-template-sync-github-hook']);
});


test("owner without auth", async t => {
  const provider = new GithubProvider();
  const owner = await provider.repositoryGroup(REPOSITORY_OWNER);
  t.is(owner, undefined);
  //t.is(owner.name, 'arlac77');
});
