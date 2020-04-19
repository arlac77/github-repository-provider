import { RepositoryGroup } from "repository-provider";
import { GithubMixin } from "./github-mixin.mjs";

/**
 *
 */
export class GithubOwner extends GithubMixin(RepositoryGroup) {
  async _createRepository(name, options) {
    // todo check that group is current auth user
    const response = await this.octokit.repos.createForAuthenticatedUser({
      //org: this.name,
      name,
      ...options
    });

    return new this.repositoryClass(this, name, options);
  }

  /**
   * Normalizes a repository name
   * always use lowercase names
   * @param {string} name
   * @return {string} normalized name
   */
  normalizeRepositoryName(name,forLookup) {
    name = super.normalizeRepositoryName(name,forLookup);
    return forLookup ? name.toLowerCase() : name;
  }

  async deleteRepository(name) {
    const response = await this.octokit.repos.delete({
      owner: this.name,
      repo: name
    });

    console.log(response);
    return super.deleteRepository();
  }
}
