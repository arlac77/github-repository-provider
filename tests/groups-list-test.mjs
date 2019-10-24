import test from "ava";
import { groupListTest } from "repository-provider-test-support";

import { GithubProvider } from "../src/github-provider.mjs";

const config = GithubProvider.optionsFromEnvironment(process.env);

test(groupListTest, new GithubProvider(config), undefined, { arlac77: {} });
test(groupListTest, new GithubProvider(config), "*", { arlac77: {} });
test(groupListTest, new GithubProvider(config), "arlac77", { arlac77: {} });
test(groupListTest, new GithubProvider(config), "xarlac77", undefined);
