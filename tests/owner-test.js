import test from 'ava';
import { GithubProvider } from '../src/github-provider';

const REPOSITORY_OWNER = 'arlac77';

const config = GithubProvider.optionsFromEnvironment(process.env);

test('owner', async t => {
  const provider = new GithubProvider(config);
  const owner = await provider.repositoryGroup(REPOSITORY_OWNER);
  t.is(owner.name, 'arlac77');
});
