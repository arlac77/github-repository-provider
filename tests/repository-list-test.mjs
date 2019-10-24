import test from "ava";
import { repositoryListTest } from "repository-provider-test-support";

import { GithubProvider } from "../src/github-provider.mjs";

const config = GithubProvider.optionsFromEnvironment(process.env);

const provider = new GithubProvider(config);
test(repositoryListTest, provider, "arlac77/npm-*", {
  "npm-template-sync": { name: "npm-template-sync" }
});

test.skip(repositoryListTest, provider, "*", {
  "npm-template-sync": { name: "npm-template-sync" }
});

test.skip(repositoryListTest, provider, undefined, {
  "npm-template-sync": { name: "npm-template-sync" }
});

test("list repositories more", async t => {
  const provider = new GithubProvider(config);

  const branches = {};

  for await (const r of provider.repositories("arlac77/*")) {
    branches[r.name] = await r.defaultBranch;
  }

  //console.log(Object.keys(branches));
  t.truthy(Object.keys(branches).length > 50);
});

test("list repositories non owner", async t => {
  const provider = new GithubProvider(config);

  const repositories = {};

  for await (const r of provider.repositories("k0nsti/konsum*")) {
    repositories[r.fullName] = r;
  }

  t.truthy(Object.keys(repositories).length > 1);
  t.truthy(repositories["k0nsti/konsum"].name, "konsum");
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

  //_initializeRepositoryGroups
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
