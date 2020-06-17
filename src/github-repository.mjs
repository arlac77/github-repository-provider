import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";
import { Repository } from "repository-provider";
import { GithubMixin } from "./github-mixin.mjs";

/**
 * Repository on GitHub
 */
export class GithubRepository extends GithubMixin(Repository) {
  static get attributeMapping() {
    return {
      ...super.attributeMapping,
      archived: "isArchived",
      // is_template: "isTemplate",
      private: "isPrivate",
      default_branch: "defaultBranchName"
    };
  }

  /*
  delete_branch_on_merge
  allow_rebase_merge
  allow_merge_commit
  allow_squash_merge
  auto_init
  is_template
  */

  /**
   * @see https://developer.github.com/v3/repos/branches/
   */
  async initializeBranches() {
    for (let page = 1; ; page++) {
      const res = await this.provider.fetch(
        `/repos/${this.slug}/branches?page=${page}`
      );
      const json = await res.json();

      if (json.length === 0 || !Array.isArray(json)) {
        break;
      }

      json.forEach(b => this.addBranch(b.name, b));
    }
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

  async update() {
    return this.octokit.repos.update({
      owner: this.owner.name,
      repo: this.name,
      description: this.description
    });
  }

  /**
   * @see https://developer.github.com/v3/git/refs/
   * @param {string} ref
   * @return {string} sha of the ref
   */
  async refId(ref) {
    ref = ref.replace(/^refs\//, "");

    const res = await this.provider.fetch(`/repos/${this.slug}/git/ref/${ref}`);
    const json = await res.json();

    // TODO why does this happen ?
    if (!json.object.sha) {
      throw new Error(`no refId for '${this.name}' '${ref}'`);
    }

    return json.object.sha;
  }

  async createBranch(name, from, options) {
    const branch = this._branches.get(name);
    if (branch) {
      return branch;
    }

    let sha;

    /* if (this._branches.keys().next().value === undefined) {
    //https://stackoverflow.com/questions/9765453/is-gits-semi-secret-empty-tree-object-reliable-and-why-is-there-not-a-symbolic/9766506#9766506
    //empty_tree sha1:4b825dc642cb6eb9a060e54bf8d69288fbee4904
  //empty_tree sha256:6ef19b41225c5369f1c104d45d8d85efa9b057b53b14b4b9b939dd74decc5321

      sha = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";

      const res = await this.provider.fetch(`repos/${this.slug}/git/commits`, {
        method: "POST",
        body: JSON.stringify({
          message: "Initial commit",
          tree: sha
        })
      });

      console.log(res);
    } 
    */
    let res = await this.provider.fetch(
      `repos/${this.slug}/git/ref/heads/${
        from === undefined ? this.defaultBranchName : from.name
      }`
    );
    let json = await res.json();
    sha = json.object.sha;

    // console.log("SHA", sha);

    res = await this.provider.fetch(`repos/${this.slug}/git/refs`, {
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

    if(res.ok) {
      return super.deleteBranch(name);
    }
  }

  async deletePullRequest(name) {
    const result = await this.octokit.pulls.update({
      owner: this.owner.name,
      repo: this.name,
      pull_number: name,
      state: "closed"
    });

    this._pullRequests.delete(name);

    return result.data;
  }

  async initializeHooks() {
    const res = await this.octokit.repos.listWebhooks({
      owner: this.owner.name,
      repo: this.name
    });

    for (const h of res.data) {
      this.addHook(
        new this.hookClass(this, h.name, new Set(h.events), {
          id: h.id,
          active: h.active,
          content_type: h.content_type,
          ...h.config,
          insecure_ssl: h.config.insecure_ssl !== "0"
        })
      );
    }
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
