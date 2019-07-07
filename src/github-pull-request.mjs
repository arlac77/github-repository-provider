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

  static async *list(destination, states) {
    let pageInfo = {};

    const provider = destination.provider;

    do {
      const result = await provider.github.query(
        `query($username: String!, $repository:String!, $after: String) { repositoryOwner(login: $username)
      { repository(name:$repository) {
        pullRequests(after:$after,first:100 states: [MERGED,OPEN])
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
          after: pageInfo.endCursor
        }
      );

      const pullRequests = result.repositoryOwner.repository.pullRequests;
      pageInfo = pullRequests.pageInfo;

      for (const node of pullRequests.nodes) {
        const source = await provider.branch([node.baseRepository.nameWithOwner, node.baseRefName].join('#'));
        const dest = await provider.branch([node.headRepository.nameWithOwner, node.headRefName].join('#'));

        yield new destination.pullRequestClass(
          source,
          dest,
          String(node.number),
          node
        );
      }
    } while (pageInfo.hasNextPage);
  }

  /*
title: 'title'
body: 'body'
state: 'open'
number: 431
locked: false
id: 224112772

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
  async _merge(method='MERGE') {
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
