export function GithubMixin(base) {
  /**
   * common stuff for all github objects
   */
  return class GithubMixin extends base {
    get octokit() {
      return this.provider.octokit;
    }
  };
}
