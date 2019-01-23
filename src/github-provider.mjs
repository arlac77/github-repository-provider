import { Provider, Repository, Branch } from "repository-provider";
import { GithubRepository } from "./github-repository";
import { GithubBranch } from "./github-branch";
import { GithubOwner } from "./github-owner";
import { GithubPullRequest } from "./github-pull-request";
export { GithubRepository, GithubBranch, GithubOwner, GithubPullRequest };

import GitHub from "github-graphql-api/dist/github";
import octokit from "@octokit/rest";
import throttling from "@octokit/plugin-throttling";

/**
 * GitHub provider
 *
 * @property {Object} octokit
 */
export class GithubProvider extends Provider {
  static get defaultOptions() {
    return Object.assign(
      {
        ssh: "git@github.com:",
        url: "https://github.com/",
        graphqlApi: "https://api.github.com/graphql",
        authentication: {}
      },
      super.defaultOptions,
      {
        priority: 1000.0
      }
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
      : { authentication: { type: "token", token } };
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
