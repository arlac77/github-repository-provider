import test from "ava";
import { groupListTest, groupTest } from "repository-provider-test-support";

import { GithubProvider } from "../src/github-provider.mjs";

const config = GithubProvider.optionsFromEnvironment(process.env);

test(groupListTest, new GithubProvider(config), undefined, { arlac77: {} });
test(groupListTest, new GithubProvider(config), "*", { arlac77: {} });
test(groupListTest, new GithubProvider(config), "arlac77", { arlac77: {} });
test.skip(groupListTest, new GithubProvider(config), "arlac77/uti", {
  arlac77: {}
});
test(groupListTest, new GithubProvider(config), "xarlac77", undefined);

test(groupTest, new GithubProvider(config), "arlac77", { name: "arlac77" });
test(groupTest, new GithubProvider(config), "xarlac77", undefined);
test(groupTest, new GithubProvider(config), "k0nsti", { name: "k0nsti" });
