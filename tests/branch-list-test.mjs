import test from "ava";
import { branchListTest } from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";

const provider = GithubProvider.initialize(undefined, process.env);

test(branchListTest, provider, "arlac77/npm-*", 5);
test(branchListTest, provider, "https://github.com/arlac77/npm-*", 5);
test(branchListTest, provider, "arlac77/unknown-*");
