import test from "ava";
import { GithubProvider } from "../src/github-provider.mjs";

const REPOSITORY_NAME = "arlac77/github-repository-provider";

const config = GithubProvider.optionsFromEnvironment(process.env);

test("hooks list", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);

  const hooks = [];

  for await (const hook of repository.hooks()) {
    hooks.push(hook);
  }

  const hook = hooks.find(h => h.url === "https://notify.travis-ci.org");

  t.deepEqual(
    hook.events,
    new Set([
      "create",
      "delete",
      "issue_comment",
      "member",
      "public",
      "pull_request",
      "push",
      "repository"
    ])
  );
  t.is(hook.content_type, "form");
  t.is(hook.url, "https://notify.travis-ci.org");
  t.true(hook.active);

  t.deepEqual(hook.toJSON(), {
    name: "web",
    active: true,
    events: [
      "create",
      "delete",
      "issue_comment",
      "member",
      "public",
      "pull_request",
      "push",
      "repository"
    ],
    id: 76646763,
    insecure_ssl: false,
    content_type: "form",
    url: "https://notify.travis-ci.org"
  });
});
