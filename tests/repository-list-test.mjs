import test from "ava";
import { repositoryListTest } from "repository-provider-test-support";

import { GithubProvider } from "../src/github-provider.mjs";

const config = GithubProvider.optionsFromEnvironment(process.env);
const provider = new GithubProvider(config);

test(repositoryListTest, provider, "arlac77/npm-*", {
  "arlac77/npm-template-sync": { name: "npm-template-sync" }
});

test(repositoryListTest, provider, "xtzrtrhtl/npm-*");
test(repositoryListTest, provider, "arlac77/*", 50);

test(repositoryListTest, provider, "k0nsti/konsum*", {
  "k0nsti/konsum": { name: "konsum" },
  "k0nsti/konsum-db": { name: "konsum-db" }
});

test.skip(repositoryListTest, provider, "*", {
  "npm-template-sync": { name: "npm-template-sync" }
});

test.skip(repositoryListTest, provider, undefined, {
  "npm-template-sync": { name: "npm-template-sync" }
});
