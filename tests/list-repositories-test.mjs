import test from "ava";
import { GithubProvider } from "../src/github-provider";

const config = GithubProvider.optionsFromEnvironment(process.env);

test("list repositories", async t => {
  const provider = new GithubProvider(config);

  const repositories = {};

  for await (const r of provider.repositories("arlac77/npm-*")) {
    repositories[r.name] = r;
  }

  //console.log(Object.keys(repositories));
  t.truthy(repositories.size > 3);
});
