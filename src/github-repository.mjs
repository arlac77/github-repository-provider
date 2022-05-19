import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";
import { Repository } from "repository-provider";
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
  static get attributeMapping() {
    return {
      ...super.attributeMapping,
      archived: "isArchived",
      is_template: "isTemplate",
      private: "isPrivate",
      fork: "isFork",
      default_branch: "defaultBranchName"
    };
  }

  static get attributes() {
    return {
      ...super.attributes,
      auto_init: { type: "boolean", writable: true },
      allow_squash_merge: { type: "boolean", writable: true, default: false },
      allow_merge_commit: { type: "boolean", writable: true, default: false },
      allow_rebase_merge: { type: "boolean", writable: true, default: false },
      allow_auto_merge: { type: "boolean", writable: true, default: false },
      delete_branch_on_merge: {
        type: "boolean",
        writable: true,
        default: false
      }
    };
  }

  get defaultBranchName() {
    return "main";
  }

  /**
   * {@link https://docs.github.com/en/rest/reference/commits#list-commits}
   * @param {Object} options
   * @returns {AsyncIterator<Commit>}
   */
  async *commits(options) {
    let next = `repos/${this.slug}/commits`;

    do {
      const { response, json } = await this.provider.fetchJSON(next);

      for (const c of json) {
        yield {
          sha: c.sha,
          message: c.message,
          author: c.author,
          committer: c.committer
        };
      }
      next = getHeaderLink(response.headers);
    } while (next);
  }

  async _initializeSlot(typeName, addMethodName) {
    let next = `repos/${this.slug}/${typeName}`;

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
    return this._initializeSlot("branches", "addBranch");
  }

  /**
   * {@link https://docs.github.com/en/rest/reference/repos#list-repository-tags}
   */
  async initializeTags() {
    return this._initializeSlot("tags", "addTag");
  }

  /**
   * @return {string[]} github https url
   */
  get urls() {
    return [`${this.provider.url}${this.fullName}.git`];
  }

  /**
   * Deliver the url of issue tracking system.
   * @return {string}
   */
  get issuesURL() {
    return `${this.provider.url}${this.fullName}/issues`;
  }

  /**
   * Deliver the url of the repositories home page.
   * @return {string}
   */
  get homePageURL() {
    return `${this.provider.url}${this.fullName}#readme`;
  }

  /**
   * {@link https://developer.github.com/v3/repos/#update-a-repository}
   */
  async update() {
    return this.provider.fetch(`repos/${this.slug}`, {
      method: "PATCH",
      body: JSON.stringify(
        mapAttributesInverse(
          optionJSON(this, undefined, this.constructor.writableAttributes),
          this.constructor.attributeMapping
        )
      )
    });
  }


  #ref;

  /**
   * Get sha of a ref.
   * {@link https://developer.github.com/v3/git/refs/}
   * @param {string} ref
   * @return {Promise<string>} sha of the ref
   */
  async refId(ref) {
    ref = ref.replace(/^refs\//, "");

    if (this.#ref) {
      const sha = this.#ref.get(ref);
      if (sha) {
        return sha;
      }
    } else {
      this.#ref = new Map();
    }

    const { response, json } = await this.provider.fetchJSON(
      `repos/${this.slug}/git/ref/${ref}`,
      undefined,
      conflictErrorActions
    );
    // TODO why does this happen ?
    if (!response.ok || !json.object.sha) {
      throw new Error(`No refId for '${this.fullName}' '${ref}'`);
    }

    const sha = json.object.sha;

    this.#ref.set(ref, sha);

    return sha;
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
    }
        else {
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
      console.log(res);
      */
    }

    const res = await this.provider.fetch(`repos/${this.slug}/git/refs`, {
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
      `repos/${this.slug}/git/refs/heads/${name}`,
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
    const res = await this.provider.fetch(`repos/${this.slug}/pulls/${name}`, {
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
    let next = `repos/${this.slug}/hooks`;

    do {
      const { response, json } = await this.provider.fetchJSON(next);

      for (const h of json) {
        new this.hookClass(this, h.name, new Set(h.events), {
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
