import test from "ava";
import {
  repositoryLivecycleTest,
  createMessageDestination
} from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";

const messageDestination = createMessageDestination().messageDestination;

test("create & delete repo", async t =>
  repositoryLivecycleTest(
    t,
    GithubProvider.initialize({ messageDestination }, process.env),
    "test-repo-1",
    "arlac77",
    { description: "a description", delete_branch_on_merge: true },
    async (t, repository) => {
      t.is(repository.description, "a description", "description");
      t.is(repository.delete_branch_on_merge, true);

      t.is(repository.defaultBranchName, "main");
      const defaultBranch = await repository.defaultBranch;
      t.is(
        defaultBranch.name,
        repository.defaultBranchName,
        "default branch name"
      );
    }
  ));
