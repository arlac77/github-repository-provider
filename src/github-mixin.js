export function GithubMixin(base) {
  /**
   * common stuff for all github objects
   */
  return class GithubMixin extends base {
    get github() {
      return this.provider.github;
    }

    get octokit() {
      return this.provider.octokit;
    }

    checkForApiLimitError(err) {
      return this.provider.checkForApiLimitError(err);
    }
  };
}
