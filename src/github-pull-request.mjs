import { boolean_attribute } from "pacc";
import { PullRequest, Repository, Branch } from "repository-provider";
import { getHeaderLink } from "fetch-link-util";

/**
 * Github pull request.
 */
export class GithubPullRequest extends PullRequest {
  /**
   * All valid merge methods.
   * @return {Set<string>} valid merge methods
   */
  static validMergeMethods = new Set(["MERGE", "SQUASH", "REBASE"]);

  static attributes = {
    ...super.attributes,
    maintainer_can_modify: boolean_attribute,
    url: {
      ...PullRequest.attributes.url,
      externalName: "api"
    }
  };

  /**
   * {@link https://developer.github.com/v3/pulls/#list-pull-requests}
   * @param {Repository} repository
   * @param {Object} filter
   */
  static async *list(repository, filter = {}) {
    const query = {};

    if (filter.source) {
      query.head = `${filter.source.owner.owner.name}:${filter.source.name}`;
    }

    if (filter.destination) {
      query.base = filter.destination.name;
    }

    for (const state of filter.states || this.defaultListStates) {
      query.state = state;

      let next = `${repository.api}/pulls?${new URLSearchParams(query)}`;

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
   * @param {Object} [options]
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
      throw new Error(response.statusText + " (" + response.status + ")");
    }

    const pr = new this(source, destination, json.number, json);

    console.log(pr);
    return pr;
  }

  get api() {
    return `${this.destination.repository.api}/pulls/${this.number}`;
  }

  /**
   * {@link https://developer.github.com/v3/pulls/#merge-a-pull-request}
   */
  async _merge(method = "MERGE") {
    const res = await this.provider.fetch(`${this.api}/merge`, {
      method: "PUT",
      body: JSON.stringify({ merge_method: method, sha: "???" })
    });
  }

  /**
   *
   */
  async update() {
    const res = await this.provider.fetch(this.api, {
      method: "PATCH",
      body: JSON.stringify({
        title: this.title,
        body: this.body,
        state: this.state
      })
    });
    console.log(res);
  }
}
