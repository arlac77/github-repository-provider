import fetch from "node-fetch";
import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";

import { MultiGroupProvider } from "repository-provider";
import { GithubRepository } from "./github-repository.mjs";
import { GithubBranch } from "./github-branch.mjs";
import { GithubOwner } from "./github-owner.mjs";
import { GithubPullRequest } from "./github-pull-request.mjs";
export { GithubRepository, GithubBranch, GithubOwner, GithubPullRequest };

import Octokit from "@octokit/rest";
import throttling from "@octokit/plugin-throttling";

/**
 * <!-- skip-example -->
 * GitHub provider
 * Lookup a repository
 * known environment variables
 * - GITHUB_TOKEN or GH_TOKEN api token
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
export class GithubProvider extends MultiGroupProvider {
  static get attributes() {
    return {
      ...super.attributes,
      ssh: {
        default: "git@github.com:"
      },
      url: {
        default: "https://github.com/"
      },
      api: {
        default: "https://api.github.com"
      },
      "authentication.token": {
        env: ["GITHUB_TOKEN", "GH_TOKEN"],
        additionalAttributes: { "authentication.type": "token" },
        private: true
      },
      priority: { default: 1000.0 }
    };
  }

  /**
   * @param {Object} options
   * @return {boolean} true if authentication is present
   */
  static areOptionsSufficciant(options) {
    return options["authentication.type"] !== undefined;
  }

  constructor(options) {
    super(options);

    if (this.authentication === undefined) {
      this.authentication = {};
    }

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

  fetch(url, options = {}) {
    const headers = {
      authorization: `token ${this.authentication.token}`,
      ...options.headers
    };

    return fetch(new URL(url, this.api), {
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

  get pullRequestClass() {
    return GithubPullRequest;
  }
}

replaceWithOneTimeExecutionMethod(
  GithubProvider.prototype,
  "initializeRepositories"
);

export default GithubProvider;
