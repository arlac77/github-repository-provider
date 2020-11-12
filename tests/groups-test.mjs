import test from "ava";
import { groupListTest, groupTest } from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";

const provider = GithubProvider.initialize(undefined, process.env);

const groupArlac77 = {
  arlac77: { id: 158862, type: "User", isAdmin: false }
};

const groupKronosIntegration = {
  "Kronos-Integration": {
    url: "https://api.github.com/users/Kronos-Integration",
    type: "Organization"
  }
};

test(groupListTest, provider, undefined, groupArlac77);
test(groupListTest, provider, "*", groupArlac77);
test(groupListTest, provider, "https://github.com/*", groupArlac77);
test(groupListTest, provider, "arlac77", groupArlac77);
test(groupListTest, provider, "https://github.com/arlac77", groupArlac77);
test(groupListTest, provider, "Arlac77", groupArlac77);
test(groupListTest, provider, "https://github.com/Arlac77", groupArlac77);
test(groupListTest, provider, "kronos-integration", groupKronosIntegration);
test(groupListTest, provider, "xarlac77", 0);

test(groupTest, provider, "arlac77", { name: "arlac77" });
test(groupTest, provider, "xarlac77", undefined);
test(groupTest, provider, "k0nsti", { name: "k0nsti" });
