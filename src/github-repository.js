import { Repository } from "repository-provider";
import { GithubMixin } from "./github-mixin";

/**
 * Repository on GitHub
 */
export class GithubRepository extends GithubMixin(Repository) {
  /**
   * Name of the repository without owner
   * @return {string}
   */
  get condensedName() {
    return this.name.split(/\//)[1];
  }

  get fullName() {
    return `${this.owner.name}/${this.name}`;
  }

  /**
   * Collect all branches
   * @return {Promise}
   */
  async _initialize() {
    await super._initialize();
    const res = await this.client.get(`/repos/${this.fullName}/branches`);
    res.forEach(b => new this.provider.branchClass(this, b.name));
  }

  /*
  async fetchAllBranches() {
    let pageInfo = {};

    do {
      const result = await this.github.query(
        `query($username: String!,$after: String) { repositoryOwner(login: $username)
      { repositories(after:$after,first:100,affiliations:[OWNER])
        {pageInfo {endCursor hasNextPage}
          nodes { id name description } } }}`,
        {
          username: this.name,
          after: pageInfo.endCursor
        }
      );

      const repositories = result.repositoryOwner.repositories;
      pageInfo = repositories.pageInfo;

      for (const node of repositories.nodes) {
        const name = `${this.name}/${node.name}`;
        const repository = new this.repositoryClass(this, name, node);
        this.repositories.set(repository.name, repository);
      }
    } while (pageInfo.hasNextPage);
  }
 */
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
    const res = await this.client.get(`/repos/${this.fullName}/pulls`);

    res.forEach(b => {
      /*
      id: 157670873,
      number: 267,
      state: 'open',
      locked: false,
      title: 'merge package template from Kronos-Tools/npm-package-template',
      */

      const pr = new this.provider.pullRequestClass(this, String(b.number), {
        title: b.title,
        state: b.state
      });
    });

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
