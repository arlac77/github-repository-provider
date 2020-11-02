import test from "ava";
import { branchListTest } from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";

const provider = new GithubProvider(
  GithubProvider.optionsFromEnvironment(process.env)
);

test(branchListTest, provider, "arlac77/npm-*", 5);
test.skip(branchListTest, provider, "https://gihub.com/arlac77/npm-*", 5);
test(branchListTest, provider, "arlac77/unknown-*");
