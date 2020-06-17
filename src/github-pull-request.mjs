import { PullRequest } from "repository-provider";
import { GithubMixin } from "./github-mixin.mjs";

/**
'<https://api.github.com/repositories/253911783/pulls?page=1&state=OPEN&head=arlac77%3Apr-test%2Fsource-1>; rel="prev", <https://api.github.com/repositories/253911783/pulls?page=1&state=OPEN&head=arlac77%3Apr-test%2Fsource-1>; rel="last", <https://api.github.com/repositories/253911783/pulls?page=1&state=OPEN&head=arlac77%3Apr-test%2Fsource-1>; rel="first"',
*/
function isLastLink(link, page) {
  if (link === undefined) {
    return;
  }

  const rels = link
    .split(/\s*,\s*/)
    .map(r => {
      const m = r.match(/\?page=(\d+).*;\s*rel="(\w+)"/);
      return m ? { page: m[1], rel: m[2] } : undefined;
    })
    .filter(r => r !== undefined);

  console.log(rels);
}

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

  /**
   * GET /repos/:owner/:repo/pulls/:pull_number
   * @param repository
   * @param number
   */
  static async fetch(repository, number) {}

  /**
   * @see https://developer.github.com/v3/pulls/
   * @param repository
   * @param filter
   */
  static async *list(repository, filter = {}) {
    const provider = repository.provider;

    function bf(name, branch) {
      return branch === undefined
        ? ""
        : `&${name}=${branch.owner.name}:${branch.name}`;
    }

    const head = bf("head", filter.source);
    const base = bf("base", undefined, filter.destination); // TODO

    for (const state of [
      ...(filter.states ? filter.states : this.defaultListStates)
    ]) {
      for (let page = 1; ; page++) {
        const res = await provider.fetch(
          `/repos/${repository.slug}/pulls?page=${page}&state=${state}${head}${base}`
        );

        isLastLink(res.headers.link);

        const json = await res.json();

        if (json.length === 0 || !Array.isArray(json)) {
          break;
        }

        for (const node of json) {
          const [source, dest] = await Promise.all(
            [node.head, node.base].map(r =>
              provider.branch([r.repo.full_name, r.ref].join("#"))
            )
          );

          yield new repository.pullRequestClass(
            source,
            dest,
            node.number,
            node
          );
        }
      }
    }
  }

  /**
   * @see https://developer.github.com/v3/pulls/#create-a-pull-request
   * @param {Branch} source
   * @param {Branch} destination
   * @param {Object} options
   */
  static async open(source, destination, options) {
    for await (const p of source.provider.pullRequestClass.list(
      source.repository,
      { source, destination }
    )) {
      return p;
    }

    const res = await destination.provider.fetch(
      `/repos/${destination.repository.slug}/pulls`,
      {
        method: "POST",
        body: JSON.stringify({
          head: source.name,
          base: destination.name,
          ...options
        })
      }
    );
    const json = await res.json();
    return new source.pullRequestClass(source, destination, json.number, json);
  }

  /**
   * @see https://developer.github.com/v3/pulls/#merge-a-pull-request
   */
  async _merge(method = "MERGE") {
    const res = await this.provicer.fetch(
      `/repos/${this.source.repository.slug}/pulls/${this.number}/merge`,
      {
        method: "PUT",
        body: JSON.stringify({ merge_method: method, sha: "???" })
      }
    );
  }

  /**
   *
   */
  async _write() {
    const res = await this.provider.fetch(
      `/repos/${this.source.repository.slug}/pulls/${this.number}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          title: this.title,
          body: this.body,
          state: this.state
        })
      }
    );
    console.log(res);
  }
}
