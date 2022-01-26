import { matcher } from "matching-iterator";
import { Branch } from "repository-provider";
import {
  BaseCollectionEntry,
  BufferContentEntry,
  BufferContentEntryMixin,
  ContentEntry
} from "content-entry";

/**
 * Branch on GitHub.
 */
export class GithubBranch extends Branch {
  /**
   * Writes content into the branch
   * {@link https://developer.github.com/v3/git/blobs/#get-a-blob}
   * @param {ConentEntry} entry
   * @return {Promise<ContentEntry>} written content with sha values set
   */
  async writeEntry(entry) {
    const { json } = await this.provider.fetchJSON(
      `repos/${this.slug}/git/blobs`,
      {
        method: "POST",
        body: JSON.stringify({
          content: await entry.string,
          encoding: "utf8"
        })
      }
    );

    entry.sha = json.sha;

    return entry;
  }

  /**
   * {@link https://developer.github.com/v3/git/trees/#create-a-tree}
   * {@link https://developer.github.com/v3/git/commits/#create-a-commit}
   * {@link https://developer.github.com/v3/git/refs/#update-a-reference}
   * @param {string} message
   * @param {ContentEntry[]} entries
   * @param {Object} options
   */
  async commit(message, entries, options = {}) {
    const updates = await Promise.all(
      entries.map(entry => this.writeEntry(entry))
    );

    /*
     * 1st. commit on empty tree
     * https://stackoverflow.com/questions/9765453/is-gits-semi-secret-empty-tree-object-reliable-and-why-is-there-not-a-symbolic/9766506#9766506
     * empty_tree=$(git mktree </dev/null)
     * sha1:4b825dc642cb6eb9a060e54bf8d69288fbee4904
     * sha256:6ef19b41225c5369f1c104d45d8d85efa9b057b53b14b4b9b939dd74decc5321
     */

    const shaLatestCommit = await this.refId();
    const shaBaseTree = await this.baseTreeSha(shaLatestCommit);

    let { json } = await this.provider.fetchJSON(
      `repos/${this.slug}/git/trees`,
      {
        method: "POST",
        body: JSON.stringify({
          base_tree: shaBaseTree,
          tree: updates.map(u => {
            return {
              path: u.name,
              sha: u.sha,
              type: "blob",
              mode: "100" + u.mode.toString(8)
            };
          })
        })
      }
    );

    const shaNewTree = json.sha;

    const r = await this.provider.fetchJSON(`repos/${this.slug}/git/commits`, {
      method: "POST",
      body: JSON.stringify({
        message,
        tree: shaNewTree,
        parents: [shaLatestCommit]
      })
    });

    const sha = r.json.sha;

    return await this.provider.fetchJSON(
      `repos/${this.slug}/git/refs/heads/${this.name}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          ...options,
          sha
        })
      }
    );
  }

  /**
   * {@link https://developer.github.com/v3/repos/contents/#get-repository-content}
   * @param {string} name
   */
  async entry(name) {
    const { json } = await this.provider.fetchJSON(
      `repos/${this.slug}/contents/${name}?ref=${this.ref}`
    );

    return new this.entryClass(name, Buffer.from(json.content, "base64"));
  }

  /** @inheritdoc */
  async maybeEntry(name) {
    const res = await this.provider.fetch(
      `repos/${this.slug}/contents/${name}?ref=${this.ref}`
    );
    if (res.ok) {
      const json = await res.json();
      return new this.entryClass(name, Buffer.from(json.content, "base64"));
    }
  }

  /**
   * {@link https://developer.github.com/v3/git/commits/#get-a-commit}
   * @param {string} sha
   */
  async baseTreeSha(sha) {
    const { json } = await this.provider.fetchJSON(
      `repos/${this.slug}/git/commits/${sha}`
    );
    return json.tree.sha;
  }

  /**
   * @see https://developer.github.com/v3/git/trees/
   * @param {string} sha
   * @return {Object[]}
   */
  async tree(sha) {
    const { json } = await this.provider.fetchJSON(
      `repos/${this.slug}/git/trees/${sha}?recursive=1`
    );
    return json.tree;
  }

  async *entries(patterns) {
    const shaBaseTree = await this.baseTreeSha(await this.refId());

    for (const entry of matcher(await this.tree(shaBaseTree), patterns, {
      name: "path"
    })) {
      yield entry.type === "tree"
        ? new BaseCollectionEntry(entry.path)
        : new LazyBufferContentEntry(entry.path, entry.mode, this);
    }
  }

  /**
   * https://developer.github.com/v3/repos/contents/
   * @param {Iterator<ContentEntry>} entries
   */
  async removeEntries(entries) {
    for await (const entry of entries) {
      await this.provider.fetch(`repos/${this.slug}/contents/${entry.name}`, {
        method: "DELETE",
        body: JSON.stringify({ branch: this.name, message: "", sha: "" })
      });
    }
  }

  get entryClass() {
    return BufferContentEntry;
  }
}

class LazyBufferContentEntry extends BufferContentEntryMixin(ContentEntry) {
  constructor(name, mode, branch) {
    super(name);
    this.mode = mode;
    this.branch = branch;
  }

  get buffer() {
    return this.getBuffer();
  }

  async getBuffer() {
    if (this._buffer) {
      return this._buffer;
    }

    const branch = this.branch;
    const { json } = await branch.provider.fetchJSON(
      `repos/${branch.slug}/contents/${this.name}?ref=${branch.ref}`
    );

    this._buffer = Buffer.from(json.content, "base64");
    return this._buffer;
  }
}
