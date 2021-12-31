import { RepositoryGroup } from "repository-provider";

/**
 * Represents github repo owner either
 * - users
 * - organization
 */
export class GithubOwner extends RepositoryGroup {
  /**
   * Map attributes between external and internal representation.
   */
  static get attributeMapping() {
    return {
      ...super.attributeMapping,
      site_admin: "isAdmin"
    };
  }

  /**
   * {@link https://developer.github.com/v3/repos/#create-a-repository-for-the-authenticated-user}
   * @param {string} name
   * @param {Object} options
   * @return {Repository} newly created repository
   */
  async createRepository(name, options = {}) {
    const response = await this.provider.fetch(
      this.type === "Organization" ? `orgs/${this.name}/repos` : "user/repos",
      {
        method: "POST",
        headers: {
          accept: "application/vnd.github.nebula-preview+json"
        },
        body: JSON.stringify({
          name,
          auto_init: true,
          ...options
        })
      }
    );

    if (response.ok) {
      this.info(`Repository ${name} created`);
      options.defaultBranchName = "main";
      return this.addRepository(name, options);
    }

    this.error(`Repository ${name} creation error ${response.status}`);
  }

  /**
   * {@link https://developer.github.com/v3/repos/#delete-a-repository}
   * @param {string} name
   */
  async deleteRepository(name) {
    const response = await this.provider.fetch(`repos/${this.name}/${name}`, {
      method: "DELETE"
    });
    return super.deleteRepository(name);
  }
}
