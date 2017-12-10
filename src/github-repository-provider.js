import { Provider, Repository, Branch, PullRequest } from 'repository-provider';

const github = require('github-basic');

export class GithubBranch extends Branch {
  get client() {
    return this.provider.client;
  }

  async writeBlob(blob) {
    try {
      const path = blob.path.replace(/\\/g, '/').replace(/^\//, '');
      const mode = blob.mode || '100644';
      const type = blob.type || 'blob';

      const res = await this.client.post(
        `/repos/${this.repository.name}/git/blobs`,
        {
          content:
            typeof blob.content === 'string'
              ? blob.content
              : blob.content.toString('base64'),
          encoding: typeof blob.content === 'string' ? 'utf-8' : 'base64'
        }
      );

      return {
        path,
        mode,
        type,
        sha: res.sha
      };
    } catch (err) {
      await this.provider.checkForApiLimitError(err);
      throw err;
    }
  }

  async createPullRequest(to, msg) {
    try {
      const result = await this.client.post(
        `/repos/${this.repository.name}/pulls`,
        {
          title: msg.title,
          body: msg.body,
          base: this.name,
          head: to.name
        }
      );
      //console.log(result);
      return new PullRequest(this.repository, result.number);
    } catch (err) {
      await this.provider.checkForApiLimitError(err);
      throw err;
    }
  }

  async latestCommitSha() {
    const res = await this.client.get(
      `/repos/${this.repository.name}/git/refs/heads/${this.name}`
    );
    return res.object.sha;
  }

  async baseTreeSha(commitSha) {
    const res = await this.client.get(
      `/repos/${this.repository.name}/commits/${commitSha}`
    );

    return res.commit.tree.sha;
  }

  async commit(message, blobs, options = {}) {
    try {
      const updates = await Promise.all(blobs.map(b => this.writeBlob(b)));

      const shaLatestCommit = await this.latestCommitSha();
      const shaBaseTree = await this.baseTreeSha(shaLatestCommit);
      let res = await this.client.post(
        `/repos/${this.repository.name}/git/trees`,
        {
          tree: updates,
          base_tree: shaBaseTree
        }
      );
      const shaNewTree = res.sha;

      res = await this.client.post(
        `/repos/${this.repository.name}/git/commits`,
        {
          message,
          tree: shaNewTree,
          parents: [shaLatestCommit]
        }
      );
      const shaNewCommit = res.sha;

      res = await this.client.patch(
        `/repos/${this.repository.name}/git/refs/heads/${this.name}`,
        {
          sha: shaNewCommit,
          force: options.force || false
        }
      );

      return res;
    } catch (err) {
      await this.provider.checkForApiLimitError(err);
      throw err;
    }
  }

  async content(path, options = {}) {
    try {
      const res = await this.client.get(
        `/repos/${this.repository.name}/contents/${path}`,
        { ref: this.name }
      );
      const b = Buffer.from(res.content, 'base64');
      return b.toString();
    } catch (err) {
      await this.provider.checkForApiLimitError(err);

      if (options.ignoreMissing) {
        return '';
      }
      throw err;
    }
  }

  async tree(sha, prefix = '') {
    const list = [];

    const t = async (sha, prefix = '') => {
      const res = await this.client.get(
        `/repos/${this.repository.name}/git/trees/${sha}`
      );
      const files = res.tree;

      files.forEach(f => (f.path = prefix + f.path));

      list.push(...files);

      await Promise.all(
        files
          .filter(f => f.type === 'tree')
          .map(dir => t(dir.sha, prefix + dir.path + '/'))
      );
    };

    await t(sha, prefix);

    return list;
  }

  async list() {
    try {
      const shaBaseTree = await this.baseTreeSha(await this.latestCommitSha());
      return this.tree(shaBaseTree);
    } catch (err) {
      await this.provider.checkForApiLimitError(err);
      throw err;
    }
  }
}

export class GithubRepository extends Repository {
  constructor(provider, name) {
    super(provider, name.replace(/#.*/, ''));
    Object.defineProperty(this, 'user', { value: name.split(/\//)[0] });
  }

  get client() {
    return this.provider.client;
  }

  async branches() {
    const res = await this.client.get(`/repos/${this.name}/branches`);

    res.forEach(b => {
      const branch = new this.provider.constructor.branchClass(this, b.name);
      this._branches.set(branch.name, branch);
    });

    return this._branches;
  }

  async createBranch(name, from) {
    try {
      const res = await this.client.get(
        `/repos/${this.name}/git/refs/heads/${
          from === undefined ? 'master' : from.name
        }`
      );

      await this.client.post(`/repos/${this.name}/git/refs`, {
        ref: `refs/heads/${name}`,
        sha: res.object.sha
      });

      const b = new this.provider.constructor.branchClass(this, name);
      this._branches.set(b.name, b);
      return b;
    } catch (err) {
      await this.provider.checkForApiLimitError(err);
      throw err;
    }
  }

  async deleteBranch(name) {
    await this.client.delete(`/repos/${this.name}/git/refs/heads/${name}`);

    this._branches.delete(name);
  }

  async pullRequests() {
    const res = await this.client.delete(`/repos/${this.name}/pulls`);

    res.forEach(b => {
      const pr = new this.provider.constructor.pullRequestClass(this, b.name);
      this._pullRequests.set(pr.name, pr);
    });

    return this._pullRequests;
  }

  /*
  async deletePullRequest(name) {
//    const res = await this.client.delete(`/repos/${this.name}/pull/${name}`);
//    console.log(res);
//    return res;
    return new Error('not implemented');
  }
  */
}

export class GithubProvider extends Provider {
  static get repositoryClass() {
    return GithubRepository;
  }

  static get branchClass() {
    return GithubBranch;
  }

  static config(config) {
    return Object.assign({ version: 3 }, config);
  }

  constructor(config) {
    super(config);

    const client = github(this.config);

    Object.defineProperty(this, 'client', { value: client });
  }

  /*
{ Error: Server responded with status code 403:
{"message":"API rate limit exceeded for arlac77.","documentation_url":"https://developer.github.com/v3/#rate-limiting"}
    at Response.getBody (/usr/local/lib/node_modules/npm-template-sync/node_modules/http-response-object/index.js:34:15)
    at Client.<anonymous> (/usr/local/lib/node_modules/npm-template-sync/node_modules/github-basic/lib/client.js:116:20)
    at tryCallOne (/usr/local/lib/node_modules/npm-template-sync/node_modules/promise/lib/core.js:37:12)
    at /usr/local/lib/node_modules/npm-template-sync/node_modules/promise/lib/core.js:123:15
    at flush (/usr/local/lib/node_modules/npm-template-sync/node_modules/promise/node_modules/asap/raw.js:50:29)
    at _combinedTickCallback (internal/process/next_tick.js:131:7)
    at process._tickCallback (internal/process/next_tick.js:180:9)
  statusCode: 403,
  headers:
   { server: 'GitHub.com',
     date: 'Sun, 19 Nov 2017 19:48:35 GMT',
     'content-type': 'application/json; charset=utf-8',
     'transfer-encoding': 'chunked',
     connection: 'close',
     status: '403 Forbidden',
     'x-ratelimit-limit': '5000',
     'x-ratelimit-remaining': '0',
     'x-ratelimit-reset': '1511121268',
     'x-oauth-scopes': 'notifications, write:public_key, repo, user',
     'x-accepted-oauth-scopes': 'repo',
     'x-oauth-client-id': 'eac522c6b68c504b2aac',
     'x-github-media-type': 'github.v3; format=json',
     'access-control-expose-headers': 'ETag, Link, Retry-After, X-GitHub-OTP, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, X-OAuth-Scopes, X-Accepted-OAuth-Scopes, X-Poll-Interval',
     'access-control-allow-origin': '*',
     'content-security-policy': 'default-src \'none\'',
     'strict-transport-security': 'max-age=31536000; includeSubdomains; preload',
     'x-content-type-options': 'nosniff',
     'x-frame-options': 'deny',
     'x-xss-protection': '1; mode=block',
     'x-runtime-rack': '0.020507',
     'x-github-request-id': 'C753:2330:6E60E0:DF367B:5A11E012' },
  body: <Buffer 7b 22 6d 65 73 73 61 67 65 22 3a 22 41 50 49 20 72 61 74 65 20 6c 69 6d 69 74 20 65 78 63 65 65 64 65 64 20 66 6f 72 20 61 72 6c 61 63 37 37 2e 22 2c ... >,
  url: undefined }
*/
  async checkForApiLimitError(err) {
    /* TODO
     handle rate limit
     statusCode: 403
     "API rate limit exceeded for [secure]."
     "You have triggered an abuse detection mechanism. Please wait a few minutes before you try again."
    */

    if (
      err.message !== undefined &&
      (err.message.indexOf('API rate limit exceeded') >= 0 ||
        err.message.indexOf(
          'You have triggered an abuse detection mechanism'
        ) >= 0)
    ) {
      this.rateLimitReached = true;
    }

    if (err.headers) {
      if (err.headers['x-ratelimit-remaining'] == 0) {
        this.rateLimitReached = true;
      }
    }

    if (this.rateLimitReached) {
      console.log(err);
      const limit = (await this.rateLimit()).resources;
      console.log(limit);
    }
  }

  async rateLimit() {
    const limit = await this.client.get('/rate_limit');
    //  console.log(limit);
    return limit;
  }
}
