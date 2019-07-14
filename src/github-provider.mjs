import { Provider, Repository, Branch } from "repository-provider";
import { GithubRepository } from "./github-repository.mjs";
import { GithubBranch } from "./github-branch.mjs";
import { GithubOwner } from "./github-owner.mjs";
import { GithubPullRequest } from "./github-pull-request.mjs";
export { GithubRepository, GithubBranch, GithubOwner, GithubPullRequest };

import GitHub from "github-graphql-api/dist/github";
import octokit from "@octokit/rest";
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

    const oc = octokit.plugin(throttling)({
      auth: `token ${this.authentication.token}`,
      throttle: {
        onRateLimit: (retryAfter, options) => {
          console.warn(
            `Request quota exhausted for request ${options.method} ${
              options.url
            }`
          );

          if (options.request.retryCount === 0) {
            console.log(`Retrying after ${retryAfter} seconds!`);
            return true;
          }
        },
        onAbuseLimit: (retryAfter, options) => {
          console.warn(
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

  /*
    async *repositoryGroups(patterns) {
      const res = await this.octokit.repos.list({affiliation:['owner','collaborator','organization_member']});
  
      res.data.forEach(r => {
          console.log("full_name",r.full_name);
  
          const [groupName,repoName] = r.full_name.split(/\//);
  
          let rg = this._repositoryGroups.get(groupName);
          if(rg === undefined) {
            rg = new this.repositoryGroupClass(this, groupName);
            this._repositoryGroups.set(rg.name, rg);
          }
      });
  
      console.log(...this._repositoryGroups.keys());
    }
  */

  async repositoryGroup(name) {
    if (name === undefined) {
      return undefined;
    }

    let rg = this._repositoryGroups.get(name);
    if (rg !== undefined) {
      return rg;
    }

    try {
      const result = await this.github.query(
        "query($username: String!) { repositoryOwner(login: $username) { login, id } }",
        {
          username: name
        }
      );

      if (result && result.repositoryOwner) {
        rg = new this.repositoryGroupClass(this, result.repositoryOwner.login, result.repositoryOwner);
        this._repositoryGroups.set(rg.name, rg);
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
   * List repositories of the provider
   * @param {string[]|string} patterns
   * @return {Iterator<Repository>} all matching repositories of the provider
   */
  async *repositories(patterns) {
    if (!Array.isArray(patterns)) {
      patterns = [patterns];
    }

    for (const pattern of patterns) {
      const m = pattern.split(/\//);
      if (m.length === 2) {
        //console.log("GROUP", m[0]);
        const group = await this.repositoryGroup(m[0]);
        if (group) {
          yield* group.repositories(m[1]);
        }
      }
    }
  }

  /**
   * List branches of the provider
   * @param {string[]|string} patterns
   * @return {Iterator<Branch>} all matching repositories of the provider
   */
  async *branches(patterns) {
    if (!Array.isArray(patterns)) {
      patterns = [patterns];
    }

    for (const pattern of patterns) {
      const m = pattern.split(/\//);
      if (m.length === 2) {
        const group = await this.repositoryGroup(m[0]);
        if (group) {
          for await (const repository of group.repositories(m[1])) {
            yield repository.defaultBranch;
          }
        }
      }
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

export default GithubProvider;
