import { PullRequest } from "repository-provider";
import { getHeaderLink } from "fetch-link-util";

/**
 * Github pull request.
 */
export class GithubPullRequest extends PullRequest {
  /**
   * All valid merge methods.
   * @return {Set<string>} valid merge methods
   */
  static get validMergeMethods() {
    return new Set(["MERGE", "SQUASH", "REBASE"]);
  }

  static get attributeMapping() {
    return {
      ...super.attributeMapping,
      url: "api"
    };
  }

  static get attributes() {
    return {
      ...super.attributes,
      maintainer_can_modify: {
        type: "boolean"
      }
    };
  }

  /**
   * {@link https://developer.github.com/v3/pulls/#list-pull-requests}
   * @param {Repository} repository
   * @param {Object} filter
   */
  static async *list(repository, filter = {}) {
    const branchName = (name, branch) =>
      branch === undefined
        ? ""
        : `&${name}=${branch.owner.name}:${branch.name}`;

    const head = branchName("head", filter.source);
    const base = branchName("base", undefined /*filter.destination*/); // TODO

    for (const state of [
      ...(filter.states ? filter.states : this.defaultListStates)
    ]) {
      let next = `${repository.api}/pulls?state=${state}${head}${base}`;

      do {
        const provider = repository.provider;
        const { response, json } = await provider.fetchJSON(next);
        for (const node of json) {
          const [source, dest] = await Promise.all(
            [node.head, node.base].map(r =>
              provider.branch([r.repo.full_name, r.ref].join("#"))
            )
          );

          yield new this(source, dest, node.number, node);
        }
        next = getHeaderLink(response.headers);
      } while (next);
    }
  }

  /**
   * {@link https://developer.github.com/v3/pulls/#create-a-pull-request}
   * @param {Branch} source
   * @param {Branch} destination
   * @param {Object} options
   */
  static async open(source, destination, options) {
    for await (const p of this.list(source.repository, {
      source,
      destination
    })) {
      return p;
    }
    
    const { response, json } = await destination.provider.fetchJSON(
      `${destination.repository.api}/pulls`,
      {
        method: "POST",
        body: JSON.stringify({
          head: source.name,
          base: destination.name,
          ...options
        })
      }
    );

    if (!response.ok) {
      throw new Error(response.statusText + ' (' + esponse.status ')');
    }

    return new this(source, destination, json.number, json);
  }

  /**
   * {@link https://developer.github.com/v3/pulls/#merge-a-pull-request}
   */
  async _merge(method = "MERGE") {
    const res = await this.provider.fetch(
      `${this.source.repository.api}/pulls/${this.number}/merge`,
      {
        method: "PUT",
        body: JSON.stringify({ merge_method: method, sha: "???" })
      }
    );
  }

  /**
   *
   */
  async update() {
    const res = await this.provider.fetch(
      `${this.source.repository.api}/pulls/${this.number}`,
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
