import test from "ava";
import { createMessageDestination, REPOSITORY_NAME } from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";
import { Hook } from "repository-provider";

const messageDestination = createMessageDestination().messageDestination;
const provider = GithubProvider.initialize({ messageDestination }, process.env);

test("add hook", async t => {
    const repository = await provider.repository(REPOSITORY_NAME);

    const hook = new Hook(repository, "test-hook1", {
        events: new Set(["a"]),
        url: "http://somewere.com/path"
    });

    t.is(hook.owner, repository);
    t.is(hook.active, true);
    t.deepEqual(hook.events, new Set(["a"]));
});

