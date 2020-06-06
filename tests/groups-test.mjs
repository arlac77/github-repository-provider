import test from "ava";
import { groupListTest, groupTest } from "repository-provider-test-support";

import GithubProvider from "github-repository-provider";

const config = GithubProvider.optionsFromEnvironment(process.env);
const provider = new GithubProvider(config);

test(groupListTest, provider, undefined, { "GithubProvider/arlac77": {} });
test(groupListTest, provider, "*", { "GithubProvider/arlac77": {} });
test(groupListTest, provider, "arlac77", {
  "GithubProvider/arlac77": { type: "User" }
});
test(groupListTest, provider, "kronos-integration", {
  "GithubProvider/Kronos-Integration": {
    url: "https://api.github.com/users/Kronos-Integration",
    type: "Organization"
  }
});
test(groupListTest, provider, "Arlac77", { "GithubProvider/arlac77": {} });

test(groupListTest, provider, "xarlac77", undefined);

test(groupTest, provider, "arlac77", { name: "arlac77" });
test(groupTest, provider, "xarlac77", undefined);
test(groupTest, provider, "k0nsti", { name: "k0nsti" });
