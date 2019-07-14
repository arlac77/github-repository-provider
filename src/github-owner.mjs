import { RepositoryGroup } from "repository-provider";
import { GithubMixin } from "./github-mixin.mjs";

/**
 *
 */
export class GithubOwner extends GithubMixin(RepositoryGroup) {
  async _initialize() {
    await this.fetchAllRepositories();
  }

  async fetchAllRepositories() {
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
        const repository = new this.repositoryClass(this, node.name, node);
        this._repositories.set(repository.name, repository);
      }
    } while (pageInfo.hasNextPage);
  }
}
