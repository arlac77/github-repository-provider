import test from "ava";
import { repositoryListTest } from "repository-provider-test-support";

import { GithubProvider } from "../src/github-provider.mjs";

const config = GithubProvider.optionsFromEnvironment(process.env);
const provider = new GithubProvider(config);

test(repositoryListTest, provider, "arlac77/npm-*", {
  "npm-template-sync": {
    fullName: "arlac77/npm-template-sync",
    name: "npm-template-sync",
  },
});

test(repositoryListTest, provider, "xtzrtrhtl/npm-*");
test(repositoryListTest, provider, "arlac77/*", 50);

test(repositoryListTest, provider, "k0nsti/konsum*", {
  konsum: { fullName: "k0nsti/konsum", name: "konsum" },
});

test.skip(repositoryListTest, provider, "*", {
  "npm-template-sync": { name: "npm-template-sync" },
});

test.skip(repositoryListTest, provider, undefined, {
  "npm-template-sync": { name: "npm-template-sync" },
});
