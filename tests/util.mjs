import { generateBranchName } from "repository-provider";
import { StringContentEntry } from "content-entry";

export async function assertRepo(t, repository, fixture, url) {
  t.log(url);
  if (fixture === undefined) {
    t.is(repository, undefined);
  } else {
    if (fixture.name !== undefined) {
      t.is(repository.name, fixture.name, `repository.name ${url}`);
    }

    if (fixture.fullName !== undefined) {
      t.is(repository.fullName, fixture.fullName, `repository.fullName ${url}`);
    }

    if (fixture.condensedName !== undefined) {
      t.is(
        repository.condensedName,
        fixture.condensedName,
        `repository.condensedName ${url}`
      );
    }

    if (fixture.description !== undefined) {
      t.is(
        repository.description,
        fixture.description,
        `repository.description ${url}`
      );
    }

    if (fixture.uuid !== undefined) {
      t.is(repository.uuid, fixture.uuid, `repository.uuid ${url}`);
    }

    if (fixture.id !== undefined) {
      t.is(repository.id, fixture.id, `repository.id ${url}`);
    }

    if (fixture.owner) {
      if (fixture.owner.name !== undefined) {
        t.is(
          repository.owner.name,
          fixture.owner.name,
          `repository.owner.name ${url}`
        );
      }

      if (fixture.owner.id !== undefined) {
        t.is(
          repository.owner.id,
          fixture.owner.id,
          `repository.owner.id ${url}`
        );
      }
      if (fixture.owner.uuid !== undefined) {
        t.is(
          repository.owner.uuid,
          fixture.owner.uuid,
          `repository.owner.uuid ${url}`
        );
      }
    }

    if (fixture.hooks) {
      for await (const h of repository.hooks()) {
        const fh = fixture.hooks.find(x => x.id === h.id);
        if (fh) {
          t.is(h.id, fh.id, `hooks.id ${url}`);
          t.is(h.url, fh.url, `hooks.url ${url}`);
          t.is(h.active, fh.active, `hooks.active ${url}`);
          t.deepEqual(h.events, fh.events, `hooks.events ${url}`);
        }
      }
    }

    if (fixture.provider) {
      t.is(
        repository.provider.constructor,
        fixture.provider,
        `provider ${url}`
      );
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

  t.is(pr.source, source, "pull request source");
  t.is(pr.destination, destination, "pull request destination");
  t.true(pr.number !== undefined, "pull request number");

  t.is(pr.title, `test pr from ${name}`, "pull request title");
  t.is(pr.body, "this is the body\n- a\n- b\n- c", "pull request body");
  t.is(pr.state, "OPEN", "pull request state");
  t.is(pr.locked, false, "pull request locked");
  t.is(pr.merged, false, "pull request merged");

  for await (const p of provider.pullRequestClass.list(repository)) {
    console.log("LIST", p, pr.equals(p));
  }

  //await pr.decline();
  await source.delete();
}

export async function assertCommit(t, repository, entryName = "README.md") {
  const branchName = await generateBranchName(repository, "commit-test/*");
  const branch = await repository.createBranch(branchName);
  try {
    const commit = await branch.commit("message text", [
      new StringContentEntry(entryName, `file content #${branchName}`)
    ]);

    t.is(commit.ref, `refs/heads/${branchName}`);
  } finally {
    await repository.deleteBranch(branchName);
  }
}
