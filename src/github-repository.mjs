import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";
import {
  boolean_attribute,
  url_attribute,
  size_attribute,
  language_attribute,
  string_attribute_writable
} from "pacc";
import {
  Repository,
  mapAttributesInverse,
  optionJSON,
  Commit
} from "repository-provider";
import { getHeaderLink } from "fetch-link-util";
import { defaultStateActions, errorHandler } from "fetch-rate-limit-util";

const conflictErrorActions = {
  ...defaultStateActions,
  409: errorHandler
};

/**
 * Repository on GitHub.
 */
export class GithubRepository extends Repository {
  #refs = new Map();
  #trees = new Map();
  #commits = new Map();

  static get attributeMapping() {
    return {
      ...super.attributeMapping,
      disabled: "isDisabled",
      archived: "isArchived",
      is_template: "isTemplate",
      private: "isPrivate",
      fork: "isFork",
      default_branch: "defaultBranchName",
      url: "api"
    };
  }

  static attributes = {
    ...super.attributes,
    auto_init: boolean_attribute,
    size: size_attribute,
    language: language_attribute,
    gitignore_template: string_attribute_writable,
    license_template: string_attribute_writable,
    allow_squash_merge: boolean_attribute,
    allow_merge_commit: boolean_attribute,
    allow_rebase_merge: boolean_attribute,
    allow_auto_merge: boolean_attribute,
    delete_branch_on_merge: boolean_attribute,
    issuesURL: url_attribute,
    squash_merge_commit_title: string_attribute_writable,
    squash_merge_commit_message: string_attribute_writable,
    merge_commit_title: string_attribute_writable,
    merge_commit_message: string_attribute_writable
    //custom_properties: default_attribute
  };

  /**
   * @return {string} "main"
   */
  get defaultBranchName() {
    return "main";
  }

  /**
   * {@link https://docs.github.com/en/rest/reference/commits#list-commits}
   * @param {Object} options
   * @returns {AsyncIterable<Commit>}
   */
  async *commits(options) {
    let next = `${this.api}/commits`;

    do {
      const { response, json } = await this.provider.fetchJSON(next);

      for (const c of json) {
        const commit = new Commit(this, c);

        this.#commits.set(commit.sha, commit);

        yield commit;
      }
      next = getHeaderLink(response.headers);
    } while (next);
  }

  async addCommit(tree, parents, message) {
    const result = await this.provider.fetchJSON(`${this.api}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        tree,
        parents,
        message
      })
    });

    this.#commits.set(result.json.sha, result.json);
    return result.json;
  }

  /**
   * {@link https://developer.github.com/v3/git/commits/#get-a-commit}
   * @param {string} sha
   * @return {Promise<Object>} response
   */
  async commitForSha(sha) {
    let commit = this.#commits.get(sha);
    if (commit) {
      return commit;
    }

    const { json } = await this.provider.fetchJSON(
      `${this.api}/git/commits/${sha}`
    );

    commit = new Commit(this, json);

    this.#commits.set(commit.sha, commit);

    return commit;
  }

  /**
   * @see https://developer.github.com/v3/git/trees/
   * @param {string} sha
   * @return {Promise<Object[]>}
   */
  async tree(sha) {
    let tree = this.#trees.get(sha);
    if (tree) {
      return tree;
    }

    const { json } = await this.provider.fetchJSON(
      `${this.api}/git/trees/${sha}?recursive=1`
    );

    tree = json.tree;

    this.#trees.set(sha, tree);

    return tree;
  }

  /**
   * @see https://developer.github.com/v3/git/trees/
   * @param {Object[]} updates
   * @param {string} base base tree sha
   * @returns {Promise<Object>} newly created tree
   */
  async addTree(updates, base) {
    let { json } = await this.provider.fetchJSON(`${this.api}/git/trees`, {
      method: "POST",
      body: JSON.stringify({
        base_tree: base,
        tree: updates.map(u => {
          return {
            path: u.name,
            sha: u.sha,
            type: "blob",
            mode: "100" + u.mode.toString(8)
          };
        })
      })
    });

    this.#trees.set(json.sha, json);

    return json;
  }

  async #initializeSlot(typeName, addMethodName) {
    let next = `${this.api}/${typeName}`;

    do {
      const { response, json } = await this.provider.fetchJSON(next);
      json.forEach(b => this[addMethodName](b.name, b));
      next = getHeaderLink(response.headers);
    } while (next);
  }

  /**
   * {@link https://developer.github.com/v3/repos/branches/#list-branches}
   */
  async initializeBranches() {
    return this.#initializeSlot("branches", "addBranch");
  }

  /**
   * {@link https://docs.github.com/en/rest/reference/repos#list-repository-tags}
   */
  async initializeTags() {
    return this.#initializeSlot("tags", "addTag");
  }

  /**
   * @return {string} github https url
   */
  get url() {
    return `${this.provider.url}${this.fullName}`;
  }

  /**
   * Deliver the url of issue tracking system.
   * @return {string}
   */
  get issuesURL() {
    return `${this.url}/issues`;
  }

  /**
   * Deliver the url of the repositories home page.
   * @return {string}
   */
  get homePageURL() {
    return `${this.url}#readme`;
  }

  /**
   * API endpoint for ourselfs.
   * @return {string}
   */
  get api() {
    return `${this.provider.api}/repos/${this.slug}`;
  }

  /**
   * {@link https://docs.github.com/de/rest/repos/repos?apiVersion=2022-11-28#update-a-repository}
   */
  async update() {
    return this.provider.fetch(this.api, {
      method: "PATCH",
      body: JSON.stringify(
        mapAttributesInverse(
          optionJSON(this, undefined, this.constructor.writableAttributes),
          this.constructor.attributeMapping
        )
      )
    });
  }

  /**
   * Get sha of a ref.
   * {@link https://developer.github.com/v3/git/refs/}
   * @param {string} ref
   * @return {Promise<string>} sha of the ref
   */
  async refId(ref) {
    ref = ref.replace(/^refs\//, "");

    let sha = this.#refs.get(ref);
    if (sha) {
      return sha;
    }

    const { response, json } = await this.provider.fetchJSON(
      `${this.api}/git/ref/${ref}`,
      { stateActions: conflictErrorActions }
    );
    // TODO why does this happen ?
    if (!response.ok || !json.object.sha) {
      let message = `No refId for '${this.fullName}' '${ref}'`;

      if (!response.ok) {
        message += "," + response.statusText + " (" + response.status + ")";
      }

      throw new Error(message);
    }

    sha = json.object.sha;

    this.#refs.set(ref, sha);

    return sha;
  }

  /**
   * @param {string} ref
   * @param {string} sha
   */
  _setRefId(ref, sha) {
    ref = ref.replace(/^refs\//, "");
    this.#refs.set(ref, sha);
  }

  /**
   * {@link https://docs.github.com/en/github-ae@latest/rest/git/refs#update-a-reference}
   * @param {string} ref
   * @param {string} sha
   * @param {Object} options
   * @returns {Promise<Object>}
   *
   */
  async setRefId(ref, sha, options) {
    ref = ref.replace(/^refs\//, "");

    const result = await this.provider.fetchJSON(
      `${this.api}/git/refs/${ref}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          ...options,
          sha
        })
      }
    );

    if (result.response.ok) {
      this.#refs.set(ref, sha);
      return result.json;
    }
  }

  async createBranch(name, from, options) {
    await this.initializeBranches();

    const branch = await this.branch(name);
    if (branch) {
      return branch;
    }

    let sha;

    if (this.hasBranches) {
      sha = await this.refId(
        `heads/${from ? from.name : this.defaultBranchName}`
      );
    } else {
      /*
       * https://stackoverflow.com/questions/9765453/is-gits-semi-secret-empty-tree-object-reliable-and-why-is-there-not-a-symbolic/9766506#9766506
       * sha1:4b825dc642cb6eb9a060e54bf8d69288fbee4904
       * sha256:6ef19b41225c5369f1c104d45d8d85efa9b057b53b14b4b9b939dd74decc5321
       */
      sha = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
      /*const res = await this.provider.fetch(`repos/${this.slug}/git/commits`, {
        method: "POST",
        body: JSON.stringify({
          message: "Initial commit",
          tree: sha
        })
      });
      */
    }

    const res = await this.provider.fetch(`${this.api}/git/refs`, {
      method: "POST",
      body: JSON.stringify({
        ref: `refs/heads/${name}`,
        sha
      })
    });

    if (res.ok) {
      return this.addBranch(name, options);
    }

    throw new Error(`Unable to create branch '${name}'`);
  }

  async deleteBranch(name) {
    const res = await this.provider.fetch(
      `${this.api}/git/refs/heads/${name}`,
      {
        method: "DELETE"
      }
    );

    if (res.ok) {
      return super.deleteBranch(name);
    }
  }

  /**
   * {@link https://developer.github.com/v3/pulls/#update-a-pull-request}
   *
   * @param {string} name
   */
  async deletePullRequest(name) {
    const res = await this.provider.fetch(`${this.api}/pulls/${name}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "closed" })
    });

    if (res.ok) {
      super.deletePullRequest(name);
    }
  }

  /**
   * {@link https://developer.github.com/v3/repos/hooks/}
   */
  async initializeHooks() {
    let next = `${this.api}/hooks`;

    do {
      const { response, json } = await this.provider.fetchJSON(next);

      for (const h of json) {
        this.addHook(h.name, {
          ...h,
          ...h.config
        });
      }
      next = getHeaderLink(response.headers);
    } while (next);
  }
}

replaceWithOneTimeExecutionMethod(
  GithubRepository.prototype,
  "initializeBranches"
);

replaceWithOneTimeExecutionMethod(
  GithubRepository.prototype,
  "initializeHooks"
);

replaceWithOneTimeExecutionMethod(
  GithubRepository.prototype,
  "initializePullRequests"
);
