import { RepositoryGroup } from "repository-provider";
import { GithubMixin } from "./github-mixin";

/**
 *
 */
export class GithubOwner extends GithubMixin(RepositoryGroup) {
  async _initialize() {
    await this.fetchAllRepositories();
  }

  async fetchAllRepositories() {
    let pageInfo;

    do {
      const body = `{
        pageInfo {
          endCursor
          hasNextPage }
        nodes { id name description } } }`;

      const result = await this.github.query(
        `query($username: String!) { repositoryOwner(login: $username)
      { repositories(first:100,affiliations:[OWNER])
        ${body}}`,
        {
          username: this.name
        }
      );

      const repositories = result.repositoryOwner.repositories;
      pageInfo = repositories.pageInfo;

      for (const node of repositories.nodes) {
        const name = `${this.name}/${node.name}`;
        const r = new this.repositoryClass(this, name, node);
        this.repositories.set(name, r);
      }
    } while (pageInfo.hasNextPage);
  }
}
