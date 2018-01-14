import test from 'ava';
import { GithubProvider } from '../src/github-repository-provider';

const REPOSITORY_NAME = 'arlac77/sync-test-repository';

const config = {
  auth: process.env.GH_TOKEN
};

test('pull requests', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    REPOSITORY_NAME + '#some-other-branch'
  );

  const prs = await repository.pullRequests();

  if (prs.size === 0) {
    t.is(prs.size, 0);
  } else {
    const pr = prs.values().next().value;

    t.is(pr.name.length, 3);
  }
});
