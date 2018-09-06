import { PullRequest } from "repository-provider";
import { GithubMixin } from "./github-mixin";

export class GithubPullRequest extends GithubMixin(PullRequest) {
  /**
   * @see https://octokit.github.io/rest.js/#api-PullRequests-merge
   */
  async merge() {
    try {
      return (await this.octokit.pullRequests.merge({
        owner: this.repository.owner.name,
        repo: this.repository.name,
        number: this.name
      })).data;
    } catch (error) {
      if (error.message) {
        error.message = JSON.parse(error.message);
      }
      throw error;
    }
  }
}
