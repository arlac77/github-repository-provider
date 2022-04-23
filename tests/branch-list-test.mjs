import test from "ava";
import {
  branchListTest,
  createMessageDestination
} from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";

const messageDestination = createMessageDestination().messageDestination;
const provider = GithubProvider.initialize({ messageDestination }, process.env);

test(branchListTest, provider, "arlac77/npm-*", 3);
test(branchListTest, provider, "https://github.com/arlac77/npm-*", 3);
test(branchListTest, provider, "arlac77/unknown-*");
