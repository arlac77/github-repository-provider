import { PullRequest } from "repository-provider";
import { GithubMixin } from "./github-mixin";

/**
 * Github pull request
 */
export class GithubPullRequest extends GithubMixin(PullRequest) {
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
  async merge() {
    const result = await this.octokit.pulls.merge({
      owner: this.repository.owner.name,
      repo: this.repository.name,
      number: this.name
    });

    this.merged = result.data.merged;

    return this;
  }
}
