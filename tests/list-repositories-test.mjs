import test from "ava";
import { GithubProvider } from "../src/github-provider.mjs";

const config = GithubProvider.optionsFromEnvironment(process.env);

test("list repositories", async t => {
  const provider = new GithubProvider(config);

  const repositories = {};

  for await (const r of provider.repositories("arlac77/npm-*")) {
    repositories[r.name] = r;
  }

  //console.log(Object.keys(repositories));
  t.truthy(Object.keys(repositories).length > 3);
});

test("list repositories non owner", async t => {
  const provider = new GithubProvider(config);

  const repositories = {};

  for await (const r of provider.repositories("k0nsti/konsum*")) {
    repositories[r.fullName] = r;
  }

  t.truthy(Object.keys(repositories).length > 1);
  t.truthy(repositories['k0nsti/konsum'].name, 'konsum');
});

test("list repositories negative group", async t => {
  const provider = new GithubProvider(config);

  const repositories = {};

  for await (const r of provider.repositories("xtzrtrhtl/npm-*")) {
    repositories[r.name] = r;
  }

  t.truthy(Object.keys(repositories).length === 0);
});


test.skip("list repositories all", async t => {
  const provider = new GithubProvider(config);

  for await (const g of provider.repositoryGroups()) {
    console.log(g);
  }

  const repositories = {};

  for await (const r of provider.repositories("*/*")) {
    repositories[r.name] = r;
  }
  console.log(Object.keys(repositories));

  t.truthy(Object.keys(repositories).length === 0);
});
