import test from "ava";
import GithubProvider from "github-repository-provider";

const REPOSITORY_NAME = "arlac77/github-repository-provider";

const provider = GithubProvider.initialize(undefined, process.env);

test("hooks list", async t => {
  const repository = await provider.repository(REPOSITORY_NAME);

  const hooks = [];

  for await (const hook of repository.hooks()) {
    hooks.push(hook);
  }

  const hook = hooks.find(h => h.url === "https://deepscan.io/api/webhook/github");

  t.deepEqual(
    hook.events,
    new Set([
      "pull_request",
      "push"
    ])
  );
  t.is(hook.content_type, "json");
  t.is(hook.url, "https://deepscan.io/api/webhook/github");
  t.true(hook.active);
  t.is(hook.name, "web");

  t.deepEqual(hook.toJSON(), {
    name: "web",
    active: true,
    events: [
      "pull_request",
      "push"
    ],
    id: 234751464,
    insecure_ssl: false,
    secret: "********",
    content_type: "json",
    url: "https://deepscan.io/api/webhook/github"
  });
});
