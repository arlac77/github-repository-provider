import { Repository } from "repository-provider";
import { GithubMixin } from "./github-mixin";

/**
 * Repository on GitHub
 */

export class GithubRepository extends GithubMixin(Repository) {
  constructor(owner, name, options) {
    super(owner, name.replace(/#.*$/, ""), options);
  }

  /**
   * Name of the repository without owner
   * @return {string}
   */
  get condensedName() {
    return this.name.split(/\//)[1];
  }

  /**
   * Collect all branches
   * @return {Promise}
   */
  async _initialize() {
    await super._initialize();
    const res = await this.client.get(`/repos/${this.name}/branches`);

    res.forEach(b => new this.provider.branchClass(this, b.name));
  }

  /**
   * @return {string[]} github https url
   */
  get urls() {
    return [`${this.provider.url}${this.name}.git`];
  }

  /**
   * Deliver the url of issue tracking system.
   * @return {string}
   */
  get issuesURL() {
    return `${this.provider.url}${this.name}/issues`;
  }

  /**
   * Deliver the url of the repositories home page.
   * @return {string}
   */
  get homePageURL() {
    return `${this.provider.url}${this.name}#readme`;
  }

  async createBranch(name, from) {
    try {
      const res = await this.client.get(
        `/repos/${this.name}/git/refs/heads/${
          from === undefined ? "master" : from.name
        }`
      );

      await this.client.post(`/repos/${this.name}/git/refs`, {
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
    await this.client.delete(`/repos/${this.name}/git/refs/heads/${name}`);
    return super.deleteBranch(name);
  }

  async pullRequests() {
    const res = await this.client.get(`/repos/${this.name}/pulls`);

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
    const res = await this.client.delete(`/repos/${this.name}/pull/${name}`);
    console.log(res);

    this._pullRequests.delete(name);

    return res;
  }
}
