import { PullRequest } from "repository-provider";
import { GithubMixin } from "./github-mixin.mjs";

/**
 * Github pull request
 */
export class GithubPullRequest extends GithubMixin(PullRequest) {
  /**
   * All valid merge methods
   * @return {Set<string>} valid merge methods
   */
  static get validMergeMethods() {
    return new Set(["MERGE", "SQUASH", "REBASE"]);
  }

  static async fetch(repository, number) {}

  static async *list(destination, states = this.defaultListStates) {
    let pageInfo = {};

    const provider = destination.provider;

    do {
      const result = await provider.github.query(
        `query($username: String!, $repository:String!, $states:[PullRequestState!], $after: String) { repositoryOwner(login: $username)
      { repository(name:$repository) {
        pullRequests(after:$after,first:100 states:$states)
        {pageInfo {endCursor hasNextPage}
          nodes {
            number
            title
            state
            locked
            merged
            baseRepository {
              nameWithOwner
            }
            baseRefName
            headRepository {
              nameWithOwner
            }
            headRefName
       }}}}}`,
        {
          repository: destination.name,
          username: destination.owner.name,
          after: pageInfo.endCursor,
          states: [...states]
        }
      );

      if (!result.repositoryOwner.repository) {
        break;
      }

      const pullRequests = result.repositoryOwner.repository.pullRequests;
      pageInfo = pullRequests.pageInfo;

      for (const node of pullRequests.nodes) {
        const dest = await provider.branch(
          [node.baseRepository.nameWithOwner, node.baseRefName].join("#")
        );
        const source = await provider.branch(
          [node.headRepository.nameWithOwner, node.headRefName].join("#")
        );

        yield new destination.pullRequestClass(
          source,
          dest,
          String(node.number),
          node
        );
      }
    } while (pageInfo.hasNextPage);
  }

  static async open(source, destination, options) {
    const result = await source.octokit.pulls.create({
      owner: destination.owner.name,
      repo: destination.repository.name,
      base: destination.name,
      head: source.name,
      ...options
    });

    /*
  delete result.data.base;
  delete result.data.head;
  console.log(result.data);
*/

    return new source.pullRequestClass(
      source,
      destination,
      result.data.number,
      result.data
    );
  }

  /*
    node_id: 'MDExOlB1bGxSZXF1ZXN0MjI0MTEyNzcy',
    created_at: '2018-10-18T22:00:45Z',
    updated_at: '2018-10-18T22:00:45Z',
    closed_at: null,
    merged_at: null,
    merge_commit_sha: null,
    assignee: null,
    assignees: [],
    requested_reviewers: [],
    requested_teams: [],
    labels: [],
    milestone: null,
*/

  /**
   * @see https://octokit.github.io/rest.js/#api-PullRequests-merge
   */
  async _merge(method = "MERGE") {
    const result = await this.octokit.pulls.merge({
      owner: this.repository.owner.name,
      repo: this.repository.name,
      pull_number: this.name,
      merge_method: method
    });

    //this.merged = result.data.merged;
  }

  async _write() {
    const result = await this.octokit.pulls.merge({
      owner: this.repository.owner.name,
      repo: this.repository.name,
      state: this.state,
      base: this.destination.name,
      pull_number: this.name,
      title: this.title,
      body: this.body
    });
  }
}
