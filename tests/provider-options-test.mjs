import test from "ava";
import GithubProvider from "github-repository-provider";

test("provider env options", async t => {
  t.deepEqual(GithubProvider.optionsFromEnvironment({ GH_TOKEN: "abc" }), {
    "authentication.type": "token",
    "authentication.token": "abc"
  });
});
