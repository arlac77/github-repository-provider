import test from "ava";
import { GithubProvider } from "../src/github-provider.mjs";

const REPOSITORY_OWNER = "arlac77";

const config = GithubProvider.optionsFromEnvironment(process.env);
const provider = new GithubProvider(config);

test("owner with auth", async t => {
  const owner = await provider.repositoryGroup(REPOSITORY_OWNER);
  t.is(owner.name, REPOSITORY_OWNER);

  const repo = await owner.repository("github-repository-provider");
  t.is(repo.name, "github-repository-provider");
  t.is(repo.fullName, "arlac77/github-repository-provider");
  t.true(owner._repositories.size > 25);
});

test("list repositories", async t => {
  const owner = await provider.repositoryGroup(REPOSITORY_OWNER);

  const reps = {};
  for await (const r of owner.repositories("npm-template*")) {
    reps[r.name] = r;
  }

  t.true(Object.keys(reps).length >= 2);
  t.truthy(reps['npm-template-sync']);
  t.truthy(reps['npm-template-sync-github-hook']);
});

test("list branches", async t => {
  const owner = await provider.repositoryGroup(REPOSITORY_OWNER);

  const branches = {};
  for await (const b of owner.branches("npm-template*#master")) {
    branches[b.fullName] = b;
  }

  t.true(Object.keys(branches).length >= 2);
  t.truthy(branches['arlac77/npm-template-sync#master']);
  t.truthy(branches['arlac77/npm-template-sync-github-hook#master']);
});


test("owner without auth", async t => {
  const provider = new GithubProvider();
  const owner = await provider.repositoryGroup(REPOSITORY_OWNER);
  t.is(owner, undefined);
  //t.is(owner.name, 'arlac77');
});
