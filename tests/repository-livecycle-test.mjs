import test from "ava";
import { repositoryLivecycleTest } from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";

test("create & delete repo", async t =>
  repositoryLivecycleTest(
    t,
    GithubProvider.initialize(undefined, process.env),
    "test-repo-1",
    "arlac77"
  ));
