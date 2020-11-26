import test from "ava";
import { repositoryListTest } from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";

const provider = GithubProvider.initialize(undefined, process.env);

test(repositoryListTest, provider, "arlac77/Npm-*", {
  "arlac77/npm-template-sync": { name: "npm-template-sync" }
});

test(repositoryListTest, provider, "xtzrtrhtl/npm-*");
test(repositoryListTest, provider, "https://github.com/arlac77/*", 100);
test(repositoryListTest, provider, "git@github.com:arlac77/*", 100);
test(repositoryListTest, provider, "arlac77/*", 100);
test(repositoryListTest, provider, "Arlac77/*", 100);

test(repositoryListTest, provider, "k0nsti/konsum*", {
  "k0nsti/konsum": { defaultBranchName: "master", name: "konsum" },
  "k0nsti/konsum-db": { name: "konsum-db" }
});

test(repositoryListTest, provider, "*", {
  "arlac77/template-github": { isTemplate: true },
  "arlac77/npm-template-sync": { isArchived: false, name: "npm-template-sync" },
  "Kronos-Integration/service": { name: "service" },
  "Kronos-Tools/npm-package-template-minimal": { isArchived: true }
});

test(repositoryListTest, provider, undefined, {
  "arlac77/npm-template-sync": { name: "npm-template-sync" }
});
