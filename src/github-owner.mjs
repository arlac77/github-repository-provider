import { replaceWithOneTimeExecutionMethod } from "one-time-execution-method";
import { RepositoryGroup } from "repository-provider";
import { GithubMixin } from "./github-mixin.mjs";

/**
 *
 */
export class GithubOwner extends GithubMixin(RepositoryGroup) {
  /**
   * @see https://developer.github.com/v4/object/repository/
   */
  async initialize() {
    let pageInfo = {};

    do {
      const result = await this.github.query(
        `query($username: String!,$after: String) { repositoryOwner(login: $username)
      { repositories(after:$after,first:100,affiliations:[OWNER])
        {pageInfo {endCursor hasNextPage}
          nodes { id name description isArchived isLocked isDisabled } } }}`,
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

  async _createRepository(name, options) {
    // todo check that group is current auth user
    const response = await this.octokit.repos.createForAuthenticatedUser({
      //org: this.name,
      name,
      ...options
    });

    return new this.repositoryClass(this, name, options);
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

replaceWithOneTimeExecutionMethod(GithubOwner.prototype, "initialize");
