import test from "ava";
import GithubProvider from "github-repository-provider";

const REPOSITORY_OWNER = "arlac77";

const provider = GithubProvider.initialize(undefined, process.env);

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

  t.true(Object.keys(reps).length >= 1);
  t.truthy(reps['npm-template-sync']);
});

test("list branches", async t => {
  const owner = await provider.repositoryGroup(REPOSITORY_OWNER);

  const branches = {};
  for await (const b of owner.branches("npm-template*#master")) {
    branches[b.fullName] = b;
  }

  t.true(Object.keys(branches).length >= 1);
  t.truthy(branches['arlac77/npm-template-sync#master']);
});


test("owner without auth", async t => {
  const provider = new GithubProvider();
  const owner = await provider.repositoryGroup(REPOSITORY_OWNER);
  t.is(owner, undefined);
  //t.is(owner.name, 'arlac77');
});
