import test from "ava";
import { branchListTest } from "repository-provider-test-support";

import { GithubProvider } from "../src/github-provider.mjs";

const config = GithubProvider.optionsFromEnvironment(process.env);

const provider = new GithubProvider(config);
test(branchListTest, provider, "arlac77/npm-*", 5);
test(branchListTest, provider, "arlac77/unknown-*");
