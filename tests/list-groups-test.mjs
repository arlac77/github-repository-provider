import test from "ava";
import { GithubProvider } from "../src/github-provider.mjs";

const config = GithubProvider.optionsFromEnvironment(process.env);

test("list groups", async t => {
  const provider = new GithubProvider(config);

  const groups = {};

  for await (const g of provider.repositoryGroups("*")) {
    groups[g.name] = g;
  }

  //console.log(Object.keys(groups));
  t.truthy(Object.keys(groups).length >= 1);
});
