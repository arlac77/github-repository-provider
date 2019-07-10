import { generateBranchName } from "repository-provider";
import { StringContentEntry } from "content-entry";

export async function assertRepo(t, repository, fixture) {
  if (fixture === undefined) {
    t.is(repository, undefined);
  } else {
    t.is(repository.fullName, fixture.fullName);

    if(fixture.description !== undefined) {
      t.is(repository.description, fixture.description);
    }

    if (fixture.owner) {
      t.is(repository.owner.name, fixture.owner.name);
      t.is(repository.owner.id, fixture.owner.id);
    }

    if (fixture.hooks) {
      for await (const h of repository.hooks()) {
        const fh = fixture.hooks.find(x => x.id === h.id);
        if (fh) {
          t.is(h.id, fh.id);
          t.is(h.url, fh.url);
          t.is(h.active, fh.active);
          t.deepEqual(h.events, fh.events);
        }
      }
    }

    if (fixture.provider) {
      t.is(repository.provider.constructor, fixture.provider);
    }
  }
}

export async function pullRequestLivecycle(t, provider, repoName) {
  const repository = await provider.repository(repoName);

  const name = await generateBranchName(repository, "pr-test/*");

  const destination = await repository.defaultBranch;
  const source = await destination.createBranch(name);

  const commit = await source.commit("message text", [
    new StringContentEntry("README.md", `file content #${name}`)
  ]);

  const pr = await provider.pullRequestClass.open(source, destination, {
    title: `test pr from ${name}`,
    body: "this is the body\n- a\n- b\n- c"
  });

  t.is(pr.source, source);
  t.is(pr.destination, destination);
  t.true(pr.number !== undefined);

  t.is(pr.title, `test pr from ${name}`);
  t.is(pr.body, "this is the body\n- a\n- b\n- c");
  t.is(pr.state, "OPEN");
  t.is(pr.locked, false);
  t.is(pr.merged, false);

  for await (const p of provider.pullRequestClass.list(repository)) {
    console.log("LIST", p, pr.equals(p));
  }

  //await pr.decline();
  await source.delete();
}
