import { RepositoryGroup } from "repository-provider";
import { GithubMixin } from "./github-mixin.mjs";

/**
 * @see https://developer.github.com/v3/repos/#create-a-repository-for-the-authenticated-user
 */
export class GithubOwner extends GithubMixin(RepositoryGroup) {
  async createRepository(name, options) {
    const res = await this.provider.fetch("/user/repos", {
      method: "POST",
      body: JSON.stringofy({
        name,
        ...options
      })
    });

    console.log(res);
    return this.addRepository(name, options);
  }

  /**
   * @see https://developer.github.com/v3/repos/#delete-a-repository
   * @param name
   */
  async deleteRepository(name) {
    const res = await this.provider.fetch(`/repos/${this.name}/${name}`, {
      method: "DELETE"
    });
    console.log(res);
    return super.deleteRepository();
  }
}
