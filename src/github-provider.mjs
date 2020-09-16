import fetch from "node-fetch";
import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";
import { rateLimitHandler } from "fetch-rate-limit-util";

import { MultiGroupProvider } from "repository-provider";
import { GithubRepository } from "./github-repository.mjs";
import { GithubBranch } from "./github-branch.mjs";
import { GithubOwner } from "./github-owner.mjs";
import { GithubPullRequest } from "./github-pull-request.mjs";
export { GithubRepository, GithubBranch, GithubOwner, GithubPullRequest };

const domain = "github.com";

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
 */
export class GithubProvider extends MultiGroupProvider {
  static get attributes() {
    return {
      ...super.attributes,
      ssh: {
        type: "url",
        default: `git@${domain}:`
      },
      url: {
        type: "url",
        default: `https://${domain}/`
      },
      api: {
        type: "url",
        default: `https://api.${domain}`
      },
      "authentication.token": {
        type: "string",
        env: ["GITHUB_TOKEN", "GH_TOKEN"],
        additionalAttributes: { "authentication.type": "token" },
        private: true,
        mandatory: true
      },
      priority: { default: 1000.0 }
    };
  }

  constructor(options) {
    super(options);

    if (this.authentication === undefined) {
      this.authentication = {};
    }
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
    return rateLimitHandler(() =>
      fetch(new URL(url, this.api), {
        ...options,
        headers: {
          authorization: `token ${this.authentication.token}`,
          ...options.headers
        }
      })
    );
  }

  /**
   * {@link https://developer.github.com/v3/repos/#list-repositories-for-the-authenticated-user}
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
        group.addRepository(repoName, r);
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
      `git+ssh://${domain}`,
      `git://${domain}/`,
      `git@${domain}:`
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
