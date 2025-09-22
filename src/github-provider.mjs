import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";
import { stateActionHandler } from "fetch-rate-limit-util";
import {
  url_attribute,
  priority_attribute,
  hostname_attribute,
  token_attribute,
  object_attribute
} from "pacc";
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
   * @return {string} default environment name prefix for the provider instance
   */
  static get instanceIdentifier() {
    return "GITHUB_";
  }

  static attributes = {
    ...super.attributes,
    host: {
      ...hostname_attribute,
      env: ["{{instanceIdentifier}}HOST", "GH_HOST"],
      default: host
    },
    ssh: url_attribute,
    url: {
      ...url_attribute,
      env: "{{instanceIdentifier}}SERVER_URL"
    },
    api: {
      ...url_attribute,
      env: "{{instanceIdentifier}}API_URL"
    },
    authentication: {
      ...object_attribute,
      attributes: {
        token: {
          ...token_attribute,
          // @see https://cli.github.com/manual/gh_help_environment
          env: [
            "{{instanceIdentifier}}TOKEN",
            "GH_TOKEN" // declare GH_ as identifier
          ],
          additionalValues: { "authentication.type": "token" },
          mandatory: true
        }
      }
    },
    priority: { ...priority_attribute, default: 1000.0 }
  };

  set ssh(value) {
    this._ssh = value;
  }

  get ssh() {
    return this._ssh ?? `git@${this.host}:`;
  }

  set url(value) {
    this._url = value.endsWith("/") ? value : value + "/";
  }

  get url() {
    return this._url ?? `https://${this.host}/`;
  }

  set api(value) {
    this._api = value.replace(/\/$/, "");
  }

  get api() {
    return this._api ?? `https://api.${this.host}`;
  }

  fetch(url, options = {}) {
    options.reporter = (url, ...args) => this.trace(url.toString(), ...args);
    options.cache = this.cache;
    options.agent = this.agent;

    const authorization = {};
    if(this.authentication?.token) {
      authorization.authorization = `token ${this.authentication.token}`
    }

    return stateActionHandler(new URL(url, this.api), {
      ...options,
      headers: {
        accept: "application/vnd.github+json",
        ...authorization,
        ...options.headers
      }
    });
  }

  fetchJSON(url, options = {}) {
    options.postprocess = async response => {
      return { response, json: await response.json() };
    };

    return this.fetch(url, options);
  }

  /**
   * {@link https://developer.github.com/v3/repos/#list-repositories-for-the-authenticated-user}
   */
  async initializeRepositories() {
    try {
      for (let page = 1; ; page++) {
        const url = `user/repos?page=${page}&per_page=100`;
        const { json } = await this.fetchJSON(url);

        if (json?.length === 0 || !Array.isArray(json)) {
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
    } catch (e) {
      throw e;
    }
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
    const url = this.url;
    return super.repositoryBases.concat([
      url,
      "git+" + url,
      `git+ssh://${this.host}`,
      `git://${this.host}/`,
      `git@${this.host}:`
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

  get repositoryClass() {
    return GithubRepository;
  }

  get branchClass() {
    return GithubBranch;
  }

  get repositoryGroupClass() {
    return GithubOwner;
  }
}

replaceWithOneTimeExecutionMethod(
  GithubProvider.prototype,
  "initializeRepositories"
);

export default GithubProvider;
