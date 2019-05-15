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

test("list repositories negative group", async t => {
  const provider = new GithubProvider(config);

  const repositories = {};

  for await (const r of provider.repositories("xtzrtrhtl/npm-*")) {
    repositories[r.name] = r;
  }

  t.truthy(Object.keys(repositories).length === 0);
});
