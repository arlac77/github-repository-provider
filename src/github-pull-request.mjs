import { PullRequest } from "repository-provider";
import { GithubMixin } from "./github-mixin.mjs";

/**
'<https://api.github.com/repositories/253911783/pulls?page=1&state=OPEN&head=arlac77%3Apr-test%2Fsource-1>; rel="prev", <https://api.github.com/repositories/253911783/pulls?page=1&state=OPEN&head=arlac77%3Apr-test%2Fsource-1>; rel="last", <https://api.github.com/repositories/253911783/pulls?page=1&state=OPEN&head=arlac77%3Apr-test%2Fsource-1>; rel="first"',
*/
function isLastLink(link, page) {
  if(link === undefined) {
    return;
  }

  const rels = link.split(/\s*,\s*/).map(r => {
    const m = r.match(/\?page=(\d+).*;\s*rel="(\w+)"/);
    return m ? { page: m[1], rel: m[2] } : undefined;
  }).filter(r => r !== undefined);

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

  static async open(source, destination, options) {
    for await (const p of source.provider.pullRequestClass.list(
      source.repository,
      { source, destination }
    )) {
      return p;
    }

    //    try {
    const result = await source.octokit.pulls.create({
      owner: destination.owner.name,
      repo: destination.repository.name,
      base: destination.name,
      head: source.name,
      ...options
    });

    return new source.pullRequestClass(
      source,
      destination,
      result.data.number,
      result.data
    );
    /*  } catch (e) {
      if (
        e.errors && 
        e.errors.find(e =>
          e.message.startsWith("A pull request already exists")
        )
      ) {

        for await (const p of source.provider.pullRequestClass.list(source.repository,source,destination)) {
          return p;
        }
      } else throw e;
    }*/
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
