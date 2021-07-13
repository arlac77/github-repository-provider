import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";
import { Repository } from "repository-provider";
import { getHeaderLink } from "fetch-link-util";

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
      auto_init: { type: "boolean" },
      allow_squash_merge: { type: "boolean" },
      allow_merge_commit: { type: "boolean" },
      allow_rebase_merge: { type: "boolean" },
      delete_branch_on_merge: { type: "boolean" }
    };
  }

  get defaultBranchName() {
    return "main";
  }

  async _initializeSlot(typeName, addMethodName) {
    let next = `/repos/${this.slug}/${typeName}`;

    do {
      const response = await this.provider.fetch(next);

      if (!response.ok) {
        this.error(
          `Unable to fetch ${typeName} ${response.status} ${response.url}`
        );
        return;
      }

      const json = await response.json();
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
    return this.provider.fetch(`/repos/${this.slug}`, {
      method: "PATCH",
      body: JSON.stringify({ description: this.description })
    });
  }

  /**
   * {@link https://developer.github.com/v3/git/refs/}
   * @param {string} ref
   * @return {string} sha of the ref
   */
  async refId(ref) {
    ref = ref.replace(/^refs\//, "");

    const res = await this.provider.fetch(`/repos/${this.slug}/git/ref/${ref}`);

    if (!res.ok) {
      throw new Error(`Unable to fetch ${res.url}: ${res.code}`);
    }

    const json = await res.json();

    // TODO why does this happen ?
    if (!json.object.sha) {
      throw new Error(`No refId for '${this.name}' '${ref}'`);
    }

    return json.object.sha;
  }

  async createBranch(name, from, options) {
    const branch = this._branches.get(name);
    if (branch) {
      return branch;
    }

    let sha;

    if (this._branches.size === 0) {
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
    } else {
      const res = await this.provider.fetch(
        `repos/${this.slug}/git/ref/heads/${
          from === undefined ? this.defaultBranchName : from.name
        }`
      );
      let json = await res.json();
      sha = json.object.sha;
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
    const res = await this.provider.fetch(`/repos/${this.slug}/pulls/${name}`, {
      method: "PATCH",
      body: JSON.stringify({ state: "closed" })
    });

    if (res.ok) {
      this._pullRequests.delete(name);
    }
  }

  /**
   * {@link https://developer.github.com/v3/repos/hooks/}
   */
  async initializeHooks() {
    let next = `/repos/${this.slug}/hooks`;

    do {
      const response = await this.provider.fetch(next);

      for (const h of await response.json()) {
        const id = h.id;
        delete h.id;
        new this.hookClass(this, id, new Set(h.events), {
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
