import { Repository } from "repository-provider";
import { GithubMixin } from "./github-mixin";

/**
 * Repository on GitHub
 */
export class GithubRepository extends GithubMixin(Repository) {
  get fullName() {
    return `${this.owner.name}/${this.name}`;
  }

  /**
   * Collect all branches
   * @return {Promise}
   */
  async _initialize() {
    await super._initialize();
    await this.fetchAllBranches();
  }

  async fetchAllBranches() {
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
      //console.log(JSON.stringify(result, undefined, 2));

      const refs = result.repositoryOwner.repository.refs;
      pageInfo = refs.pageInfo;

      for (const edge of refs.edges) {
        const branch = new this.branchClass(this, edge.node.name, edge.node);
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

  async createBranch(name, from) {
    try {
      const res = await this.client.get(
        `/repos/${this.fullName}/git/refs/heads/${
          from === undefined ? "master" : from.name
        }`
      );

      await this.client.post(`/repos/${this.fullName}/git/refs`, {
        ref: `refs/heads/${name}`,
        sha: res.object.sha
      });

      return new this.provider.branchClass(this, name);
    } catch (err) {
      await this.provider.checkForApiLimitError(err);
      throw err;
    }
  }

  async deleteBranch(name) {
    await this.client.delete(`/repos/${this.fullName}/git/refs/heads/${name}`);
    return super.deleteBranch(name);
  }

  async pullRequests() {
    let pageInfo = {};

    do {
      const result = await this.github.query(
        `query($username: String!, $repository:String!, $after: String) { repositoryOwner(login: $username)
      { repository(name:$repository) {
        pullRequests(after:$after,first:100)
        {pageInfo {endCursor hasNextPage}
          edges { node {
            number
            title
            state
       }}}}}}`,
        {
          repository: this.name,
          username: this.owner.name,
          after: pageInfo.endCursor
        }
      );

      const pullRequests = result.repositoryOwner.repository.pullRequests;
      pageInfo = pullRequests.pageInfo;

      for (const edge of pullRequests.edges) {
        const pr = new this./*provider.*/ pullRequestClass(
          this,
          String(edge.node.number),
          edge.node
        );
        this._pullRequests.set(pr.name, pr);
      }
    } while (pageInfo.hasNextPage);

    return this._pullRequests;
  }

  async deletePullRequest(name) {
    const res = await this.client.delete(
      `/repos/${this.fullName}/pull/${name}`
    );
    console.log(res);

    this._pullRequests.delete(name);

    return res;
  }
}
