import { matcher } from "matching-iterator";
import { Branch } from "repository-provider";
import {
  CollectionEntry,
  BufferContentEntry,
  ContentEntry
} from "content-entry";

/**
 * Branch on GitHub.
 */
export class GithubBranch extends Branch {
  #entries = new Map();

  constructor(owner, name, options) {
    super(owner, name, options);

    if (options?.commit) {
      owner._setRefId(this.ref, options.commit.sha);
    }
  }

  /**
   * Writes content into the branch
   * {@link https://developer.github.com/v3/git/blobs/#get-a-blob}
   * @param {ContentEntry} entry
   * @return {Promise<ContentEntry>} written content with sha values set
   */
  async writeEntry(entry) {
    const { json } = await this.provider.fetchJSON(`${this.api}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({
        content: await entry.string,
        encoding: "utf8"
      })
    });

    this.#entries.set(entry.name, entry);

    entry.sha = json.sha;

    return entry;
  }

  /**
   * {@link https://developer.github.com/v3/git/trees/#create-a-tree}
   * {@link https://developer.github.com/v3/git/commits/#create-a-commit}
   * {@link https://developer.github.com/v3/git/refs/#update-a-reference}
   * @param {string} message
   * @param {ContentEntry[]} entries
   * @param {Object} [options]
   */
  async commit(message, entries, options) {
    /*
     * 1st. commit on empty tree
     * https://stackoverflow.com/questions/9765453/is-gits-semi-secret-empty-tree-object-reliable-and-why-is-there-not-a-symbolic/9766506#9766506
     * empty_tree=$(git mktree </dev/null)
     * sha1:4b825dc642cb6eb9a060e54bf8d69288fbee4904
     * sha256:6ef19b41225c5369f1c104d45d8d85efa9b057b53b14b4b9b939dd74decc5321
     */

    const updates = await Promise.all(
      entries.map(entry => this.writeEntry(entry))
    );

    const sha = await this.refId;
    const latestCommit = await this.owner.commitForSha(sha);
    const tree = await this.owner.addTree(updates, latestCommit.tree.sha);
    const commit = await this.owner.addCommit(tree.sha, [sha], message);

    return this.owner.setRefId(this.ref, commit.sha, options);
  }

  /**
   * {@link https://developer.github.com/v3/repos/contents/#get-repository-content}
   * @param {string} name
   */
  async entry(name) {
    const entry = this.#entries.get(name);
    if (entry) {
      return entry;
    }

    const f = async () => {
      const { json } = await this.provider.fetchJSON(
        `${this.api}/contents/${name}?ref=${this.ref}`
      );

      const entry = new BufferContentEntry(
        name,
        undefined,
        Buffer.from(json.content, "base64")
      );

      this.#entries.set(name, entry);
      return entry;
    };

    const p = f();

    this.#entries.set(name, p);

    return p;
  }

  /**
   *
   * @param {string[]|string} patterns
   * @return {AsyncGenerator<ContentEntry>} all matching entries in the branch
   */
  async *entries(patterns) {
    const commit = await this.owner.commitForSha(await this.refId);

    for (const entry of matcher(
      await this.owner.tree(commit.tree.sha),
      patterns,
      {
        name: "path"
      }
    )) {
      switch (entry.type) {
        case "tree":
          {
            const e = new CollectionEntry(entry.path);
            this.#entries.set(e.name, e);
            yield e;
          }
          break;
        case "blob":
          {
            const e = new LazyBufferContentEntry(
              entry.path,
              { mode: parseInt(entry.mode, 8) },
              this
            );
            this.#entries.set(e.name, e);
            yield e;
          }
          break;
        /*    case "commit":
          break;*/
      }
    }
  }

  /**
   * https://developer.github.com/v3/repos/contents/
   * @param {AsyncIterable<ContentEntry>} entries
   */
  async removeEntries(entries) {
    for await (const entry of entries) {
      await this.provider.fetch(`${this.api}/contents/${entry.name}`, {
        method: "DELETE",
        body: JSON.stringify({ branch: this.name, message: "", sha: "" })
      });

      this.#entries.delete(entry.name);
    }
  }
}

class LazyBufferContentEntry extends BufferContentEntry {
  constructor(name, options, branch) {
    super(name, options);
    this.branch = branch;
  }

  get buffer() {
    return this.getBuffer();
  }

  set buffer(value) {
    this._buffer = value;
  }

  async getBuffer() {
    if (this._buffer) {
      return this._buffer;
    }

    const branch = this.branch;

    const f = async () => {
      const { json } = await branch.provider.fetchJSON(
        `${branch.api}/contents/${this.name}?ref=${branch.ref}`
      );

      this._buffer = Buffer.from(json.content, "base64");
      return this._buffer;
    };

    this._buffer = f();
    return this._buffer;
  }
}
