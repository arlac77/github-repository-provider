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

  async initializeBranches() {
    let pageInfo = {};

    do {
      const result = await this.github.query(
        `query($owner:String!,$name:String!,$after: String) {
  repositoryOwner(login: $owner) {
    repository(name:$name) {
        refs(after:$after,first:100,refPrefix:"refs/heads/")
        {
          pageInfo {endCursor hasNextPage}
          edges { node { name } }
        }
    }
  }
}`, // target { oid }
        {
          owner: this.owner.name,
          name: this.name,
          after: pageInfo.endCursor
        }
      );
      const repo = result.repositoryOwner.repository;

      if (!repo) {
        break;
      }
      const refs = repo.refs;
      pageInfo = refs.pageInfo;

      for (const edge of refs.edges) {
        this.addBranch(edge.node.name, edge.node);
      }
    } while (pageInfo.hasNextPage);
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
   *
   * @param {string} ref
   * @return {string} sha of the ref
   */
  async refId(ref) {
    const result = await this.github.query(
      `query($owner:String!,$repository:String!,$ref:String!) {
      repository(owner:$owner,name:$repository) {
        ref(qualifiedName:$ref) {
          target { oid }
        }}}`,
      {
        owner: this.owner.name,
        repository: this.name,
        ref
      }
    );

    // TODO why does this happen ?
    if (!result.repository.ref) {
      throw new Error(`no refId for '${this.name}' '${ref}'`);
    }

    return result.repository.ref.target.oid;
  }

  async createBranch(name, from, options) {
    const branch = this._branches.get(name);
    if (branch) {
      return branch;
    }

    const res = await this.octokit.git.getRef({
      owner: this.owner.name,
      repo: this.name,
      ref: `heads/${from === undefined ? this.defaultBranchName : from.name}`
    });

    await this.octokit.git.createRef({
      owner: this.owner.name,
      repo: this.name,
      ref: `refs/heads/${name}`,
      sha: res.data.object.sha
    });

    return this.addBranch(name, options);
  }

  async deleteBranch(name) {
    await this.octokit.git.deleteRef({
      owner: this.owner.name,
      repo: this.name,
      ref: `heads/${name}`
    });
    return super.deleteBranch(name);
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
