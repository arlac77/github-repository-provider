import test from "ava";
import { GithubProvider } from "../src/github-provider";
import { GithubBranch } from "../src/github-branch";
import { GithubRepository } from "../src/github-repository";

const REPOSITORY_NAME = "arlac77/sync-test-repository";
const REPOSITORY_OWNER = "arlac77";

const config = GithubProvider.optionsFromEnvironment(process.env);

test("provider", async t => {
  const provider = new GithubProvider(config);

  t.is(provider.priority, 1000.0);

  const repository = await provider.repository(REPOSITORY_NAME);

  t.is(repository.fullName, REPOSITORY_NAME);
  t.is(repository.name, "sync-test-repository");
  t.is(repository.owner.name, "arlac77");

  const branches = await repository.branches();
  t.is(branches.get("master").name, "master");

  const branch = await repository.branch("master");

  t.is(branch.owner.name, "arlac77");
  t.is(branch.name, "master");
});

test.skip("provider create repo", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.createRepo("arlac77/test-repo-1");
  t.is(repository.name, "arlac77/test-repo-1");
});

test("provider unreachable host", async t => {
  try {
    const provider = new GithubProvider();
    const repository = await provider.repository(
      "https://mygit.com/arlac77/sync-test-repository"
    );
    t.is(repository, undefined);
  } catch (e) {
    console.log(e);
    t.is(true, false);
  }
});

test("provider repo with full https url", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    "https://github.com/" + REPOSITORY_NAME
  );

  t.is(repository.fullName, REPOSITORY_NAME);
  t.is(
    repository.urls.find(u => u.startsWith("http")),
    "https://github.com/" + REPOSITORY_NAME + ".git"
  );

  t.is(repository.url, "https://github.com/" + REPOSITORY_NAME + ".git");
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
  const provider = new GithubProvider(config);
  const repository = await provider.repository(undefined);
  t.true(repository === undefined);
});

test("provider repo with git@ url", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    "git@github.com:" + REPOSITORY_NAME
  );

  t.is(repository.fullName, REPOSITORY_NAME);
  t.is(repository.owner.name, REPOSITORY_OWNER);
  t.is(
    repository.urls.find(u => u.startsWith("http")),
    "https://github.com/" + REPOSITORY_NAME + ".git"
  );
});

test("provider repo with git://github.com", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    `git://github.com/${REPOSITORY_NAME}.git`
  );
  t.is(repository.fullName, REPOSITORY_NAME);
  t.is(repository.owner.name, REPOSITORY_OWNER);
});

test("provider repo with git+ssh://github.com", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    `git+ssh://github.com/${REPOSITORY_NAME}.git`
  );
  t.is(repository.fullName, REPOSITORY_NAME);
  t.is(repository.owner.name, REPOSITORY_OWNER);
});

test("provider repo with git@ unknown", async t => {
  const provider = new GithubProvider();
  const repository = await provider.repository(
    "git@mfelten.de/github-repository-provider.git"
  );
  t.is(repository, undefined);
});

test("provider repo with git unknown 2", async t => {
  const provider = new GithubProvider();
  const repository = await provider.repository(
    "http://www.heise.de/index.html"
  );
  t.is(repository, undefined);
});

test("provider repo with git", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    "git@github.com:arlac77/github-repository-provider.git"
  );

  t.is(repository.fullName, "arlac77/github-repository-provider");
  t.is(repository.owner.name, REPOSITORY_OWNER);
});

test("provider repo with full url .git", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    "https://github.com/arlac77/github-repository-provider.git"
  );

  t.is(repository.fullName, "arlac77/github-repository-provider");
  t.is(repository.owner.name, REPOSITORY_OWNER);
});

test("provider repo with undefined", async t => {
  const provider = new GithubProvider(config);
  const branch = await provider.branch(undefined);

  t.is(branch, undefined);
});

test("provider branch with full url .git#branch", async t => {
  const provider = new GithubProvider(config);
  const branch = await provider.branch(
    "https://github.com/arlac77/github-repository-provider.git#master"
  );

  t.is(branch.name, "master");
  t.is(branch.url, "https://github.com/arlac77/github-repository-provider.git");
});

test("provider repo with full url .git#branch", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    "https://github.com/arlac77/github-repository-provider.git#master"
  );

  t.is(repository.fullName, "arlac77/github-repository-provider");
  t.is(repository.owner.name, "arlac77");
});

test("provider repo with full url .git#branch git+https", async t => {
  const provider = new GithubProvider(config);
  const branch = await provider.branch(
    "git+https://github.com/arlac77/github-repository-provider.git#master"
  );

  t.is(branch.name, "master");
  t.is(branch.url, "https://github.com/arlac77/github-repository-provider.git");
  t.is(branch.owner.name, REPOSITORY_OWNER);
  t.is(branch.fullCondensedName, "arlac77/github-repository-provider");
});

test("provider repo with branch name", async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME + "#master-1");

  t.is(repository.fullName, REPOSITORY_NAME);
  t.is(repository.owner.name, REPOSITORY_OWNER);

  const branches = await repository.branches();
  t.is(branches.get("master").name, "master");
});
