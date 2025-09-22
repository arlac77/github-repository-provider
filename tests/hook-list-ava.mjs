import test from "ava";
import { filterWritable } from "pacc";
import { createMessageDestination } from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";

const messageDestination = createMessageDestination().messageDestination;
const provider = GithubProvider.initialize({ messageDestination }, process.env);

test("hooks list", async t => {
  const repository = await provider.repository(
    "arlac77/github-repository-provider"
  );

  const hooks = [];

  for await (const hook of repository.hooks()) {
    hooks.push(hook);
  }

  const hook = hooks.find(h => h.url === "https://codecov.io/webhooks/github");

  t.deepEqual(
    hook.events,
    new Set([
      "delete",
      "public",
      "pull_request",
      "push",
      "repository",
      "status"
    ])
  );
  t.is(hook.content_type, "json");
  t.is(hook.url, "https://codecov.io/webhooks/github");
  t.true(hook.active);
  t.is(hook.name, "web");

  t.deepEqual(hook.toJSON(filterWritable), {
    name: "web",
    active: true,
    events: [
      "delete",
      "public",
      "pull_request",
      "push",
      "repository",
      "status"
    ],
    // id: 18049825,
    //  insecure_ssl: false,
    secret: "********",
    content_type: "json",
    url: "https://codecov.io/webhooks/github"
  });
});
