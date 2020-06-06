import test from "ava";
import GithubProvider from "github-repository-provider";
import { Hook } from "repository-provider";

const REPOSITORY_NAME = "arlac77/sync-test-repository";

const config = GithubProvider.optionsFromEnvironment(process.env);
const provider = new GithubProvider(config);


test("add hook", async t => {
    const repository = await provider.repository(REPOSITORY_NAME);

    const hook = new Hook(repository, "test-hook1", new Set(["a"]), {
        url: "http://somewere.com/path"
    });

    console.log(hook);

    t.is(hook.repository, repository);
    t.is(hook.active, true);
    t.deepEqual(hook.events, new Set(["a"]));
});


