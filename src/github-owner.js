import { RepositoryGroup } from 'repository-provider';

/**
 *
 */
export class GithubOwner extends RepositoryGroup {
  get github() {
    return this.provider.github;
  }

  async _initialize() {
    await this.fetchAllRepositories();
  }

  async fetchAllRepositories() {
    let result;

    do {
      const body = `{
        pageInfo {
          endCursor
          hasNextPage }
        nodes { id name description } } }`;

      result = await this.github.query(
        `query($username: String!) { repositoryOwner(login: $username)
      { repositories(first:100,affiliations:[OWNER])
        ${body}}`,
        {
          username: this.name
        }
      );

      for (const node of result.repositoryOwner.repositories.nodes) {
        //console.log(node);

        const name = `${this.name}/${node.name}`;
        const r = new this.repositoryClass(this, name, node);
        //await r.initialize();
        this.repositories.set(name, r);
      }
    } while (result.repositoryOwner.repositories.pageInfo.hasNextPage);
  }
}
