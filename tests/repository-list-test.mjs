import test from "ava";
import { repositoryListTest } from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";

const provider = GithubProvider.initialize(undefined, process.env);

test(repositoryListTest, provider, "arlac77/Repository-*", {
  "arlac77/repository-provider": { name: "repository-provider" }
});

test(repositoryListTest, provider, "xtzrtrhtl/npm-*");
test(repositoryListTest, provider, "https://github.com/arlac77/*", 100);
test(repositoryListTest, provider, "git@github.com:arlac77/*", 100);
test(repositoryListTest, provider, "arlac77/*", 100);
test(repositoryListTest, provider, "Arlac77/*", 100);

test(repositoryListTest, provider, "konsumation/konsum*", {
  "konsumation/konsum": { defaultBranchName: "master", name: "konsum" },
  "konsumation/konsum-db": { name: "konsum-db" }
});

test(repositoryListTest, provider, "*", {
  "arlac77/template-github": { isTemplate: true },
  "arlac77/repository-provider": { isArchived: false, name: "repository-provider" },
  "Kronos-Integration/service": { name: "service" },
  "Kronos-Tools/npm-package-template-minimal": { isArchived: true }
});

test(repositoryListTest, provider, undefined, {
  "arlac77/repository-provider": { name: "repository-provider" }
});
