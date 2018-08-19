import { RepositoryGroup } from 'repository-provider';

/**
 *
 */
export class GithubOwner extends RepositoryGroup {
  get github() {
    return this.provider.github;
  }

  async fetchAllRepositories() {
    const result = await this.github.query(
      'query($username: String!) { repositoryOwner(login: $username) { repositories(first:10) { totalCount nodes { id name } } } }',
      {
        username: this.name
      }
    );

    for (const node of result.repositoryOwner.repositories.nodes) {
      console.log(node);

      const name = `${this.name}/${node.name}`;
      try {
        const r = new this.repositoryClass(this, name);
        await r.initialize();
        this.repositories.set(name, r);
      } catch (e) {}
    }
  }
}
