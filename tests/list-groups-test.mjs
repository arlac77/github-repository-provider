import test from "ava";
import { listGroupsTest } from "repository-provider-test-support";

import { GithubProvider } from "../src/github-provider.mjs";

const config = GithubProvider.optionsFromEnvironment(process.env);

test(listGroupsTest, new GithubProvider(config), undefined, { arlac77: {} });
test(listGroupsTest, new GithubProvider(config), "*", { arlac77: {} });
test(listGroupsTest, new GithubProvider(config), "arlac77", { arlac77: {} });
test(listGroupsTest, new GithubProvider(config), "xarlac77", undefined);
