import { Provider, Repository, Branch } from 'repository-provider';
import { GithubRepository } from './github-repository';
import { GithubBranch } from './github-branch';

export { GithubRepository, GithubBranch };

const github = require('github-basic');

/**
 * GitHub provider
 *
 * @property {Object} client
 * @property {boolean} rateLimitReached
 */
export class GithubProvider extends Provider {
  /**
   * Pepare configuration by mixing together defaultOptions with actual options
   * @param {Object} config raw config
   * @return {Object} combined options
   */
  static options(config) {
    return Object.assign(
      {
        ssh: 'git@github.com:',
        url: 'https://github.com/',
        version: 3
      },
      config
    );
  }

  /**
   * provide token from one of
   * - GITHUB_TOKEN
   * - GH_TOKEN
   * @param {Object} env process env
   * @return {Object} with auth token
   */
  static optionsFromEnvironment(env) {
    const token = env.GH_TOKEN || env.GITHUB_TOKEN;
    return token === undefined ? undefined : { auth: token };
  }

  constructor(config) {
    super(config);

    const client = github(this.config);

    Object.defineProperty(this, 'client', { value: client });
    this.rateLimitReached = false;
  }

  get repositoryClass() {
    return GithubRepository;
  }

  get branchClass() {
    return GithubBranch;
  }

  /**
   *
   * @return {string} provider url
   */
  get url() {
    return this.config.url;
  }

  /**
   * <!-- skip-example -->
   * Lookup a repository
   * @example
   * import GithubProvider from 'github-repository-provider';
   *
   * const ghp = new GithubProvider();
   * const r1 = ghp.repository('git@github.com:arlac77/github-repository-provider.git');
   * const r2 = ghp.repository('git://github.com/arlac77/github-repository-provider.git');
   * const r3 = ghp.repository('git+ssh://github.com/arlac77/github-repository-provider.git');
   * const r4 = ghp.repository('https://github.com/arlac77/github-repository-provider.git#master');
   * const r5 = ghp.repository('git+https://github.com/arlac77/github-repository-provider.git#master');
   * const r6 = ghp.repository('arlac77/github-repository-provider');
   * // different ways to address the same repository
   * @param {string} name
   * @return {Repository} if given name is hosted on the provider
   * @throws if name is not hosted on the provider
   */
  async repository(name) {
    if (name === undefined) {
      return undefined;
    }

    name = name.replace(/^git(\+(ssh|https))?:\/\/[^\/]+\//, '');
    name = name.replace(this.config.ssh, '');
    name = name.replace(this.url, '');
    name = name.replace(/#\w*$/, '');
    name = name.replace(/\.git$/, '');

    let r = this.repositories.get(name);
    if (r === undefined) {
      try {
        const res = await this.client.get(`/repos/${name}`);
        r = new this.repositoryClass(this, name);
        await r.initialize();
        this.repositories.set(name, r);
      } catch (e) {
        if (e.statusCode !== 404) {
          throw e;
        }
      }
    }

    return r;
  }

  set rateLimitReached(value) {
    this._rateLimitReached = value;
  }

  get rateLimitReached() {
    return this._rateLimitReached;
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
  /**
   * Check for existense of an api rate limit Error
   * also sets rateLimitReached to true
   * @param {Object} err
   * @return {Promise<boolean>} true if api rate limit error present
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

    /*if (this.rateLimitReached) {
      console.log(err);
      const limit = (await this.rateLimit()).resources;
      console.log(limit);
    }*/

    return this.rateLimitReached;
  }

  async rateLimit() {
    return await this.client.get('/rate_limit');
  }
}
