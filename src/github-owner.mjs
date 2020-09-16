import { RepositoryGroup } from "repository-provider";

/**
 * {@link https://developer.github.com/v3/repos/#create-a-repository-for-the-authenticated-user}
 */
export class GithubOwner extends RepositoryGroup {
  async createRepository(name, options) {
    const res = await this.provider.fetch("/user/repos", {
      method: "POST",
      body: JSON.stringify({
        name,
        ...options
      })
    });
    console.log(res);
    return this.addRepository(name, options);
  }

  /**
   * {@link https://developer.github.com/v3/repos/#delete-a-repository}
   * @param {string} name
   */
  async deleteRepository(name) {
    const res = await this.provider.fetch(`/repos/${this.name}/${name}`, {
      method: "DELETE"
    });
    console.log(res);
    return super.deleteRepository();
  }
}
