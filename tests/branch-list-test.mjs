import test from "ava";
import { GithubProvider } from "../src/github-provider.mjs";

const config = GithubProvider.optionsFromEnvironment(process.env);

test("list branches", async t => {
  const provider = new GithubProvider(config);

  const branches = {};

  for await (const b of provider.branches("arlac77/npm-*")) {
    branches[b.fullCondensedName] = b;
  }

  t.truthy(Object.keys(branches).length > 3);
});
