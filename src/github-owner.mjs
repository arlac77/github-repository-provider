import { RepositoryGroup } from "repository-provider";
import { GithubMixin } from "./github-mixin.mjs";

/**
 *
 */
export class GithubOwner extends GithubMixin(RepositoryGroup) {
  async createRepository(name, options) {
    // todo check that group is current auth user
    const response = await this.octokit.repos.createForAuthenticatedUser({
      //org: this.name,
      name,
      ...options
    });

    return this.addRepository(name, options);
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
