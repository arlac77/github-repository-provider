import test from "ava";
import { repositoryListTest, createMessageDestination } from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";

const messageDestination = createMessageDestination().messageDestination;
const provider = GithubProvider.initialize({ messageDestination }, process.env);

test(repositoryListTest, provider, "arlac77/Repository-*", {
  "arlac77/repository-provider": { name: "repository-provider" }
});

test(repositoryListTest, provider, "xtzrtrhtl/npm-*");
test(repositoryListTest, provider, "https://github.com/arlac77/*", 100);
test(repositoryListTest, provider, "git@github.com:arlac77/*", 100);
test(repositoryListTest, provider, "arlac77/*", 100);
test(repositoryListTest, provider, "Arlac77/*", 100);

test(repositoryListTest, provider, "konsumation/konsum*", {
  "konsumation/konsum": { defaultBranchName: "master", name: "konsum" }
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

test.skip(repositoryListTest, provider, undefined, {
  "git+https://github.com/template-tools/template-sync-cli.git": { name: "template-sync-cli" }
});
