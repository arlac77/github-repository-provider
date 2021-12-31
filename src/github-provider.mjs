import fetch from "node-fetch";
import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";
import { rateLimitHandler, defaultWaitDecide } from "fetch-rate-limit-util";

import { MultiGroupProvider } from "repository-provider";
import { GithubRepository } from "./github-repository.mjs";
import { GithubBranch } from "./github-branch.mjs";
import { GithubOwner } from "./github-owner.mjs";
import { GithubPullRequest } from "./github-pull-request.mjs";
export { GithubRepository, GithubBranch, GithubOwner, GithubPullRequest };

const host = "github.com";

/**
 * <!-- skip-example -->
 * GitHub provider.
 * Lookup a repository.
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
 */
export class GithubProvider extends MultiGroupProvider {
  /**
   * We are called github.
   * @return {string} github
   */
  static get name() {
    return "github";
  }

  /**
   * @return {string} default instance environment name prefix
   */
  static get instanceIdentifier() {
    return "GITHUB_"; // "GH_" "GH_ENTERPRISE_"
  }

  static get attributes() {
    return {
      ...super.attributes,
      host: {
        type: "string",
        env: ["{{instanceIdentifier}}HOST", "GH_HOST"],
        default: "github.com"
      },
      ssh: {
        type: "url",
        default: `git@${host}:`
      },
      url: {
        type: "url",
        env: ["{{instanceIdentifier}}SERVER_URL"],
        set: value => (value.endsWith("/") ? value : value + "/"),
        default: `https://${host}/`
      },
      api: {
        type: "url",
        env: ["{{instanceIdentifier}}API_URL"],
        set: value => value.replace(/\/$/, ""),
        default: `https://api.${host}`
      },
      "authentication.token": {
        type: "string",
        // @see https://cli.github.com/manual/gh_help_environment
        env: [
          "{{instanceIdentifier}}TOKEN",
          "GH_TOKEN" // declare GH_ as identifier
        ],
        additionalAttributes: { "authentication.type": "token" },
        private: true,
        mandatory: true
      },
      priority: { default: 1000.0 },
      reateLimitRemaining: { writable: true, default: 5000 }
    };
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
    return rateLimitHandler(
      fetch,
      new URL(url, this.api),
      {
        ...options,
        headers: {
          authorization: `token ${this.authentication.token}`,
          ...options.headers
        }
      },
      (millisecondsToWait, rateLimitRemaining, nthTry, response) => {
        this.rateLimitRemaining = rateLimitRemaining;

        const msecs = defaultWaitDecide(
          millisecondsToWait,
          rateLimitRemaining,
          nthTry,
          response
        );

        if (msecs > 0) {
          this.warn(`Rate limit reached: waiting for ${msecs / 1000}s`);
        }
        return msecs;
      }
    );
  }

  async fetchJSON(url, options) {
    for (let i = 1; ; i++) {
      try {
        const response = await this.fetch(url, options);
        if (response.ok) {
          return { response, json: await response.json() };
        }

        if (i >= 3 || response.status == 401) {
          // none repeatable
          throw new Error(
            `Unable to fetch ${response.url} (${response.status})`
          );
        }
        this.info(
          `Unable to fetch ${response.url} (${response.status}) try #${i}`
        );
      } catch (e) {
        if (i >= 3) {
          throw e;
        }
        this.error(e);
      }
    }
  }

  /**
   * {@link https://developer.github.com/v3/repos/#list-repositories-for-the-authenticated-user}
   */
  async initializeRepositories() {
    try {
      for (let page = 1; ; page++) {
        const { json } = await this.fetchJSON(
          `user/repos?page=${page}&per_page=100`,
          {
            headers: {
              accept: "application/vnd.github.baptiste-preview+json"
              //            accept: "application/vnd.github.v3+json"
            }
          }
        );
        if (json.length === 0 || !Array.isArray(json)) {
          break;
        }

        json.forEach(r => {
          const [groupName, repoName] = r.full_name.split(/\//);
          this.addRepositoryGroup(groupName, r.owner).addRepository(
            repoName,
            r
          );
        });
      }
    } catch {}
  }

  /**
   * All possible base urls
   * - github:
   * - git@github.com
   * - git://github.com
   * - git+ssh://github.com
   * - https://github.com
   * - git+https://github.com
   * @return {string[]} common base urls of all repositories
   */
  get repositoryBases() {
    return super.repositoryBases.concat([
      this.url,
      "git+" + this.url,
      `git+ssh://${host}`,
      `git://${host}/`,
      `git@${host}:`
    ]);
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
