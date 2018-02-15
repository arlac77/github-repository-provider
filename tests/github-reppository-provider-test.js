import test from 'ava';
import { GithubProvider } from '../src/github-repository-provider';
import { GithubBranch } from '../src/github-branch';
import { GithubRepository } from '../src/github-repository';

const REPOSITORY_NAME = 'arlac77/sync-test-repository';
const REPOSITORY_OWNER = 'arlac77';

const config = {
  auth: process.env.GH_TOKEN
};

test('provider', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);

  t.is(repository.name, REPOSITORY_NAME);
  t.is(repository.condensedName, 'sync-test-repository');
  t.is(repository.owner, 'arlac77');

  const branches = await repository.branches();
  t.is(branches.get('master').name, 'master');

  const branch = await repository.branch('master');

  t.is(branch.owner, 'arlac77');
  t.is(branch.name, 'master');
});

test('provider rate limit', async t => {
  const provider = new GithubProvider(config);

  const rl = await provider.rateLimit();
  t.is(rl.resources.core.limit, 5000);
});

test('provider set rateLimitReached', async t => {
  const provider = new GithubProvider(config);

  provider.rateLimitReached = true;
  t.is(provider.rateLimitReached, true);
});

test('provider repo with full url', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    'https://github.com/' + REPOSITORY_NAME
  );

  t.is(repository.name, REPOSITORY_NAME);
  t.is(
    repository.urls.find(u => u.startsWith('http')),
    'https://github.com/' + REPOSITORY_NAME + '.git'
  );

  t.is(repository.url, 'https://github.com/' + REPOSITORY_NAME + '.git');
  t.is(
    repository.issuesURL,
    'https://github.com/' + REPOSITORY_NAME + '/issues'
  );

  t.is(
    repository.homePageURL,
    'https://github.com/' + REPOSITORY_NAME + '#readme'
  );
});

test('provider repo with git unknown', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    'git@mfelten.de/github-repository-provider.git'
  );
  t.is(repository, undefined);
});

test('provider repo with git unknown 2', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    'http://www.heise.de/index.html'
  );
  t.is(repository, undefined);
});

test('provider repo with git', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    'git@github.com:arlac77/github-repository-provider.git'
  );

  t.is(repository.name, 'arlac77/github-repository-provider');
});

test('provider repo with full url .git', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    'https://github.com/arlac77/github-repository-provider.git'
  );

  t.is(repository.name, 'arlac77/github-repository-provider');
});

test('provider repo with full url .git#branch', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    'https://github.com/arlac77/github-repository-provider.git#master'
  );

  t.is(repository.name, 'arlac77/github-repository-provider');
  t.is(repository.owner, 'arlac77');
});

test('provider repo with full url .git#branch', async t => {
  const provider = new GithubProvider(config);
  const branch = await provider.branch(
    'https://github.com/arlac77/github-repository-provider.git#master'
  );

  t.is(branch.name, 'master');
  t.is(branch.url, 'https://github.com/arlac77/github-repository-provider.git');
});

test('provider repo with branch name', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    REPOSITORY_NAME + '#some-other-branch'
  );

  t.is(repository.name, REPOSITORY_NAME);
  t.is(repository.owner, REPOSITORY_OWNER);

  const branches = await repository.branches();
  t.is(branches.get('master').name, 'master');
});

test('create branch', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const branches = await repository.branches();

  //t.is(branches.get('master').name, 'master');

  const newName = `test-${branches.size}`;
  const branch = await repository.createBranch(newName);

  t.is(branch.name, newName);

  await repository.deleteBranch(newName);
  t.is(branches.get(newName), undefined);
});

test('create commit', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);

  const branches = await repository.branches();

  const newName = `commit-test-${branches.size}`;
  const branch = await repository.createBranch(newName);

  const commit = await branch.commit('message text', [
    {
      path: `README.md`,
      content: `file content #${branches.size}`
    }
  ]);

  t.is(commit.ref, `refs/heads/${newName}`);

  await repository.deleteBranch(newName);
});

test('list files', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const branch = await repository.branch('master');

  const files = await branch.list();

  t.is(files[0].path, 'README.md');
  t.is(files[0].type, 'blob');
  t.is(files[1].path, 'tests');
  t.is(files[1].type, 'tree');
  t.is(files[2].path, 'tests/rollup.config.js');
});

test('list files2', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(
    'arlac77/repository-provider' /*REPOSITORY_NAME*/
  );
  const branch = await repository.branch('master');

  const files = await branch.list();

  const allFiles = new Set(files.map(f => f.path));

  t.truthy(allFiles.has('tests/rollup.config.js'));
});

test('content', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const branch = await repository.branch('master');

  const content = await branch.content('README.md');

  t.is(content.content.length >= 5, true);
});

test('missing content', async t => {
  const provider = new GithubProvider(config);
  const repository = await provider.repository(REPOSITORY_NAME);
  const branch = await repository.branch('master');

  try {
    const content = await branch.content('missing/file', {
      ignoreMissing: true
    });
    t.pass();
  } catch (e) {
    t.fail(e);
  }
});
