export function GithubMixin(base) {
  return class GithubMixin extends base {
    get github() {
      return this.provider.github;
    }

    get client() {
      return this.provider.client;
    }
  };
}
