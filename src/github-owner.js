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
        const name = `${this.name}/${node.name}`;
        const r = new this.repositoryClass(this, name, node);
        this.repositories.set(r.name, r);
      }
    } while (pageInfo.hasNextPage);
  }
}
