import { RepositoryGroup } from "repository-provider";

/**
 * {@link https://developer.github.com/v3/repos/#create-a-repository-for-the-authenticated-user}
 */
export class GithubOwner extends RepositoryGroup {
  static get attributes() {
    return {
      ...super.attributes
    };
  }
  /**
   * Map attributes between external and internal representation
   */
  static get attributeMapping() {
    return {
      ...super.attributeMapping,
      site_admin: "isAdmin"
    };
  }

  async createRepository(name, options) {
    const response = await this.provider.fetch("/user/repos", {
      method: "POST",
      headers: {
        accept: "application/vnd.github.nebula-preview+json"
      },
      body: JSON.stringify({
        name,
        ...options
      })
    });

    if (response.ok) {
      return this.addRepository(name, options);
    }
  }

  /**
   * {@link https://developer.github.com/v3/repos/#delete-a-repository}
   * @param {string} name
   */
  async deleteRepository(name) {
    const response = await this.provider.fetch(`/repos/${this.name}/${name}`, {
      method: "DELETE"
    });
    return super.deleteRepository(name);
  }
}
