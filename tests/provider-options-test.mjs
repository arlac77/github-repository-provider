import test from "ava";
import GithubProvider from "github-repository-provider";

test("provider env options", async t => {
  t.deepEqual(
    GithubProvider.optionsFromEnvironment({
      GH_TOKEN: "abc",
      GITHUB_SERVER_URL: "https://mygihut.com",
      GITHUB_API_URL: "https://mygihut.com/api/v3"
    }),
    {
      "authentication.type": "token",
      "authentication.token": "abc",
      url: "https://mygihut.com",
      api: "https://mygihut.com/api/v3"
    }
  );
});
