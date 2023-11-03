import test from "ava";
import {
  assertRepo,
  providerTest,
  createMessageDestination,
  REPOSITORY_NAME,
  REPOSITORY_OWNER
} from "repository-provider-test-support";
import GithubProvider from "github-repository-provider";

const messageDestination = createMessageDestination().messageDestination;
const provider = GithubProvider.initialize({ messageDestination }, process.env);

test(providerTest, provider);

test("provider factory name", t => t.is(GithubProvider.name, "github"));

test("provider", async t => {
  t.is(provider.priority, 1000.0);
  t.is(provider.name, "github");

  const repository = await provider.repository(REPOSITORY_NAME);

  t.is(repository.fullName, REPOSITORY_NAME);
  t.is(repository.name, "sync-test-repository");
  t.is(repository.owner.name, "arlac77");

  const branch = await repository.branch("master");

  t.is(branch.repository.owner.name, "arlac77");
  t.is(branch.name, "master");
});

test("provider unreachable host", async t => {
  try {
    const provider = new GithubProvider();
    const repository = await provider.repository(
      "https://mygit.com/arlac77/sync-test-repository"
    );
    t.is(repository, undefined);
  } catch (e) {
    t.is(true, false);
  }
});

const repoFixtures = {
  "git@mfelten.de/github-repository-provider.git": undefined,
  "http://www.heise.de/index.html": undefined,

  ["https://github.com/" + REPOSITORY_NAME]: {
    provider: GithubProvider,
    fullName: REPOSITORY_NAME,
    owner: { name: "arlac77", id: 158862 }
  },
  ["git@github.com:" + REPOSITORY_NAME]: {
    provider: GithubProvider,
    fullName: REPOSITORY_NAME,
    owner: { name: "arlac77", id: 158862 }
  },
  [`git://github.com/${REPOSITORY_NAME}.git`]: {
    provider: GithubProvider,
    fullName: REPOSITORY_NAME,
    owner: { name: "arlac77", id: 158862 }
  },
  "git@github.com:arlac77/github-repository-provider.git": {
    provider: GithubProvider,
    name: "github-repository-provider",
    fullName: "arlac77/github-repository-provider",
    id: 110998868,
    owner: { name: "arlac77", id: 158862 }
  },
  "https://github.com/arlac77/github-repository-provider.git#master": {
    provider: GithubProvider,
    name: "github-repository-provider",
    id: 110998868,
    fullName: "arlac77/github-repository-provider",
    owner: { name: "arlac77", id: 158862 }
  },
  "https://github.com/arlac77/hook-ci.git#master": {
    provider: GithubProvider,
    name: "hook-ci",
    fullName: "arlac77/hook-ci",
    owner: { name: "arlac77", id: 158862 },
    hooks: [
      {
        id: 74923460,
        active: true,
        url: "https://mfelten.dynv6.net/services/ci/api/webhook",
        events: new Set(["push"])
      }
    ]
  }
};

test("locate repository several", async t => {
  for (const rn of Object.keys(repoFixtures)) {
    const repository = await provider.repository(rn);
    await assertRepo(t, repository, repoFixtures[rn], rn);
  }
});

test("provider repo with full https url", async t => {
  const repository = await provider.repository(
    "https://github.com/" + REPOSITORY_NAME
  );

  t.is(repository.fullName, REPOSITORY_NAME);

  t.is(repository.url, "https://github.com/" + REPOSITORY_NAME);
  t.is(
    repository.issuesURL,
    "https://github.com/" + REPOSITORY_NAME + "/issues"
  );

  t.is(
    repository.homePageURL,
    "https://github.com/" + REPOSITORY_NAME + "#readme"
  );
});

test("provider repo undefined", async t => {
  t.is(await provider.repository(undefined), undefined);
});

test("provider repo with git@ url", async t => {
  const repository = await provider.repository(
    "git@github.com:" + REPOSITORY_NAME
  );

  t.is(repository.fullName, REPOSITORY_NAME);
  t.is(repository.owner.name, REPOSITORY_OWNER);
  t.is(repository.url,"https://github.com/" + REPOSITORY_NAME);
});

test("provider repo with undefined", async t => {
  t.is(await provider.branch(undefined), undefined);
});

test("provider repo with full url .git#branch git+https", async t => {
  const branch = await provider.branch(
    "git+https://github.com/arlac77/github-repository-provider.git#master"
  );

  t.is(branch.name, "master");
  t.is(branch.url, "https://github.com/arlac77/github-repository-provider");
  t.is(branch.repository.owner.name, REPOSITORY_OWNER);
  t.is(branch.fullCondensedName, "arlac77/github-repository-provider");
});

test("provider branch with full url .git#branch", async t => {
  const branch = await provider.branch(
    "https://github.com/arlac77/github-repository-provider.git#master"
  );

  t.is(branch.name, "master");
  t.is(branch.url, "https://github.com/arlac77/github-repository-provider");
});

test("provider repo with branch name", async t => {
  const repository = await provider.repository(REPOSITORY_NAME + "#master-1");

  t.is(repository.fullName, REPOSITORY_NAME);
  t.is(repository.owner.name, REPOSITORY_OWNER);

  const branch = await repository.branch("master");
  t.is(branch.name, "master");
});
