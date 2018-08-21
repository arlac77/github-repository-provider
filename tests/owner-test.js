import test from "ava";
import { GithubProvider } from "../src/github-provider";

const REPOSITORY_OWNER = "arlac77";

const config = GithubProvider.optionsFromEnvironment(process.env);

test("owner with auth", async t => {
  const provider = new GithubProvider(config);
  const owner = await provider.repositoryGroup(REPOSITORY_OWNER);
  t.is(owner.name, "arlac77");

  const repo = await owner.repository("arlac77/github-repository-provider");
  t.is(repo.name, "arlac77/github-repository-provider");
  t.is(repo.description, "repository provider for github");
  t.true(owner.repositories.size > 25);
});

test("owner without auth", async t => {
  const provider = new GithubProvider();
  const owner = await provider.repositoryGroup(REPOSITORY_OWNER);
  t.is(owner, undefined);
  //t.is(owner.name, 'arlac77');
});
