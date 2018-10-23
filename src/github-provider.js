import { Provider, Repository, Branch } from "repository-provider";
import { GithubRepository } from "./github-repository";
import { GithubBranch } from "./github-branch";
import { GithubOwner } from "./github-owner";
import { GithubPullRequest } from "./github-pull-request";
export { GithubRepository, GithubBranch, GithubOwner, GithubPullRequest };

import GitHub from "github-graphql-api";

const octokit = require("@octokit/rest");

/**
 * GitHub provider
 *
 * @property {Object} octokit
 * @property {boolean} rateLimitReached
 */
export class GithubProvider extends Provider {
  static get defaultOptions() {
    return Object.assign(
      {
        ssh: "git@github.com:",
        url: "https://github.com/",
        graphqlApi: "https://api.github.com/graphql"
      },
      super.defaultOptions
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
    return token === undefined
      ? undefined
      : { type: "token", token: token, auth: token };
  }

  constructor(config) {
    super(config);

    const gh = new GitHub({
      token: this.config.token,
      apiUrl: this.graphqlApi
    });

    const oc = octokit();

    if (this.config.type) {
      oc.authenticate(this.config);
    }

    Object.defineProperties(this, {
      github: { value: gh },
      octokit: { value: oc }
    });

    this.rateLimitReached = false;
  }

  get repositoryClass() {
    return GithubRepository;
  }

  get branchClass() {
    return GithubBranch;
  }

  get repositoryGroupClass() {
    return GithubOwner;
  }

  async repositoryGroup(name) {
    if (name === undefined) {
      return undefined;
    }

    let rg = this.repositoryGroups.get(name);
    if (rg !== undefined) {
      return rg;
    }

    try {
      const result = await this.github.query(
        "query($username: String!) { repositoryOwner(login: $username) { login } }",
        {
          username: name
        }
      );

      if (result !== undefined && result.repositoryOwner !== undefined) {
        rg = new this.repositoryGroupClass(this, result.repositoryOwner.login);
        this.repositoryGroups.set(rg.name, rg);
      }
    } catch (e) {
      if (e == "Unauthorized") {
      } else {
        throw e;
      }
    }
    return rg;
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
    await this._initialize();

    try {
      const url = new URL(name);

      if (url.hostname !== "github.com") {
        return undefined;
      }
    } catch (e) {}

    name = name.replace(/^(git)?(\+?(ssh|https))?:\/\/[^\/]+\//, "");
    name = name.replace(this.ssh, "");
    name = name.replace(this.url, "");
    name = name.replace(/#[\w\-]*$/, "");
    name = name.replace(/\.git$/, "");

    if (name.match(/@/)) {
      return undefined;
    }

    let owner = this;

    const m = name.match(/^([^\/]+)\/(.*)/);
    if (m) {
      const rg = await this.repositoryGroup(m[1]);
      if (rg !== undefined) {
        owner = rg;

        const repository = await owner.repository(m[2]);
        if (repository !== undefined) {
          return repository;
        }
      }
    }

    return undefined;
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
      (err.message.indexOf("API rate limit exceeded") >= 0 ||
        err.message.indexOf(
          "You have triggered an abuse detection mechanism"
        ) >= 0)
    ) {
      this.rateLimitReached = true;
    }

    if (err.headers) {
      if (err.headers["x-ratelimit-remaining"] == 0) {
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

  async _initialize() {
    await super._initialize();

    try {
      const rateLimit = await this.rateLimit();
      this.rateLimitReached = rateLimit.remaining == 0;
    } catch (e) {
      this.rateLimitReached = 0;
    }
  }

  /**
   * Query the current rate limit
   * @return {Object} rate limit (remaining)
   */
  async rateLimit() {
    const result = await this.github.query("query { rateLimit { remaining } }");
    return result.rateLimit;
  }

  get pullRequestClass() {
    return GithubPullRequest;
  }
}
