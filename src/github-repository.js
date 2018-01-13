import { Repository } from 'repository-provider';

/**
 * Repository on GitHub
 */
export class GithubRepository extends Repository {
  constructor(provider, name) {
    super(provider, name.replace(/#.*/, ''));
    Object.defineProperty(this, 'user', { value: name.split(/\//)[0] });
  }

  /**
   * Collect all branches
   * @return {Promise}
   */
  async initialize() {
    await super.initialize();
    const res = await this.client.get(`/repos/${this.name}/branches`);

    res.forEach(b => new this.provider.constructor.branchClass(this, b.name));
  }

  get client() {
    return this.provider.client;
  }

  async createBranch(name, from) {
    try {
      const res = await this.client.get(
        `/repos/${this.name}/git/refs/heads/${
          from === undefined ? 'master' : from.name
        }`
      );

      await this.client.post(`/repos/${this.name}/git/refs`, {
        ref: `refs/heads/${name}`,
        sha: res.object.sha
      });

      return new this.provider.constructor.branchClass(this, name);
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

      const pr = new this.provider.constructor.pullRequestClass(
        this,
        String(b.number),
        {
          title: b.title,
          state: b.state
        }
      );
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
