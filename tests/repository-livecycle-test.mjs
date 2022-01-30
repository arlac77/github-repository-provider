import test from "ava";
import { repositoryLivecycleTest } from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";

test("create & delete repo", async t =>
  repositoryLivecycleTest(
    t,
    GithubProvider.initialize(undefined, process.env),
    "test-repo-1",
    "arlac77",
    { description: "a description", delete_branch_on_merge: true },
    async (t, repository) => {
      t.is(repository.description, "a description", "description");
      t.is(repository.delete_branch_on_merge, true);

      t.is(repository.defaultBranchName, "main");
      const defaultBranch = await repository.defaultBranch;
      t.is(defaultBranch.name, repository.defaultBranchName, "default branch name");
    }
  ));
