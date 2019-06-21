import test from "ava";
import { GithubProvider } from "../src/github-provider.mjs";


test("provider env options", async t => {
  t.deepEqual(GithubProvider.optionsFromEnvironment({ GH_TOKEN: 'abc' }),
    {
      authentication: { type: 'token', token: 'abc' },
    });
});
