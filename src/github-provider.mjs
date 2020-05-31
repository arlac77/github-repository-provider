import fetch from "node-fetch";
import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";

import { Provider } from "repository-provider";
import { GithubRepository } from "./github-repository.mjs";
import { GithubBranch } from "./github-branch.mjs";
import { GithubOwner } from "./github-owner.mjs";
import { GithubPullRequest } from "./github-pull-request.mjs";
export { GithubRepository, GithubBranch, GithubOwner, GithubPullRequest };

import GitHub from "github-graphql-api/dist/github.mjs";
import Octokit from "@octokit/rest";
import throttling from "@octokit/plugin-throttling";

/**
 * <!-- skip-example -->
 * GitHub provider
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
 * @property {Object} octokit
 */
export class GithubProvider extends Provider {
  static get defaultOptions() {
    return {
      ssh: "git@github.com:",
      url: "https://github.com/",
      api: "https://api.github.com",
      graphqlApi: "https://api.github.com/graphql",
      authentication: {},
      ...super.defaultOptions,
      priority: 1000.0
    };
  }

  /**
   * known environment variables
   * @return {Object}
   * @return {string} GITHUB_TOKEN api token
   * @return {string} GH_TOKEN api token
   */
  static get environmentOptions() {
    const def = { path: "authentication.token", template: { type: "token" } };
    return {
      GITHUB_TOKEN: def,
      GH_TOKEN: def
    };
  }

  constructor(options) {
    super(options);

    const gh = new GitHub({
      token: this.authentication.token,
      apiUrl: this.graphqlApi
    });

    const oc = new (Octokit.Octokit.plugin(throttling.throttling))({
      auth: `token ${this.authentication.token}`,
      throttle: {
        onRateLimit: (retryAfter, options) => {
          this.warn(
            `Request quota exhausted for request ${options.method} ${options.url}`
          );

          if (options.request.retryCount === 0) {
            this.info(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
        },
        onAbuseLimit: (retryAfter, options) => {
          this.warn(
            `Abuse detected for request ${options.method} ${options.url}`
          );
        }
      }
    });

    Object.defineProperties(this, {
      github: { value: gh },
      octokit: { value: oc }
    });
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

  fetch(url, options={}) {
    const headers = {
      authorization: `token ${this.authentication.token}`,
      ...options.headers
    };

    return fetch(`${this.api}/${url}`, {
      ...options,
      headers
    });
  }

  /**
   * @see https://developer.github.com/v3/repos/#list-repositories-for-the-authenticated-user
   */
  async initializeRepositories() {
    for (let page = 1; ; page++) {
      const res = await this.fetch(`user/repos?page=${page}`);
      const json = await res.json();

      if (json.length === 0 || !Array.isArray(json)) {
        break;
      }

      json.forEach(r => {
        const [groupName, repoName] = r.full_name.split(/\//);
        const group = this.addRepositoryGroup(groupName, r.owner);
        const repository = group.addRepository(repoName, r);
      });
    }
  }

  /**
   * All possible base urls
   * - git@github.com
   * - git://github.com
   * - git+ssh://github.com
   * - https://github.com
   * - git+https://github.com
   * @return {string[]} common base urls of all repositories
   */
  get repositoryBases() {
    return [
      this.url,
      "git+" + this.url,
      "git+ssh://github.com",
      "git://github.com/",
      "git@github.com:"
    ];
  }

  get areRepositoryNamesCaseSensitive() {
    return false;
  }

  get areGroupNamesCaseSensitive() {
    return false;
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

replaceWithOneTimeExecutionMethod(
  GithubProvider.prototype,
  "initializeRepositories"
);

export default GithubProvider;
