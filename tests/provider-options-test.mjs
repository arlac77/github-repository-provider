import test from "ava";
import { providerOptionsFromEnvironmentTest } from "repository-provider-test-support";

import GithubProvider from "github-repository-provider";

const ENV = {
  GH_TOKEN: "abc",
  GITHUB_SERVER_URL: "https://mygithub.com",
  GITHUB_API_URL: "https://mygithub.com/api/v3/"
};

test(
  providerOptionsFromEnvironmentTest,
  GithubProvider,
  ENV,
  {
    "authentication.type": "token",
    "authentication.token": "abc",
    url: "https://mygithub.com",
    api: "https://mygithub.com/api/v3/"
  },
  true
);

test("provider properties from env options", async t => {
  const provider = GithubProvider.initialize(undefined, ENV);

  t.is(provider.api, "https://mygithub.com/api/v3");
  t.is(provider.url, "https://mygithub.com/");
});
