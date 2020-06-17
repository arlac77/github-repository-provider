import { matcher } from "matching-iterator";
import { Branch } from "repository-provider";
import {
  BaseCollectionEntry,
  BufferContentEntry,
  BufferContentEntryMixin,
  ContentEntry
} from "content-entry";
import { GithubMixin } from "./github-mixin.mjs";

/**
 * Branch on GitHub
 */
export class GithubBranch extends GithubMixin(Branch) {
  get slug() {
    return this.repository.slug;
  }

  /**
   * Writes content into the branch
   * @see https://developer.github.com/v3/git/blobs/#get-a-blob
   * @param {Entry} entry
   * @return {Promise<Entry>} written content with sha values set
   */
  async writeEntry(entry) {
    const res = await this.provider.fetch(`/repos/${this.slug}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({
        content: await entry.getString(),
        encoding: "utf8"
      })
    });
    const json = await res.json();

    entry.sha = json.sha;

    return entry;
  }

  /**
   *
   */
  async createPullRequest(destination, msg) {
    return this.pullRequestClass.open(destination, this, msg);
  }

  /**
   * @see https://developer.github.com/v3/git/commits/#get-a-commit
   * @param {string} sha
   */
  async baseTreeSha(sha) {
    const res = await this.provider.fetch(
      `/repos/${this.slug}/git/commits/${sha}`
    );
    const json = await res.json();
    return json.tree.sha;
  }

  /** @inheritdoc */
  async commit(message, entries, options = {}) {
    const updates = await Promise.all(
      entries.map(entry => this.writeEntry(entry))
    );
    const shaLatestCommit = await this.refId();
    const shaBaseTree = await this.baseTreeSha(shaLatestCommit);

    let result = await this.octokit.git.createTree({
      owner: this.owner.name,
      repo: this.repository.name,
      tree: updates.map(u => {
        return {
          path: u.name,
          sha: u.sha,
          type: "blob",
          mode: "100" + u.unixMode.toString(8)
        };
      }),
      base_tree: shaBaseTree
    });
    const shaNewTree = result.data.sha;

    result = await this.octokit.git.createCommit({
      owner: this.owner.name,
      repo: this.repository.name,
      message,
      tree: shaNewTree,
      parents: [shaLatestCommit]
    });
    const shaNewCommit = result.data.sha;

    result = await this.octokit.git.updateRef({
      owner: this.owner.name,
      repo: this.repository.name,
      ref: `heads/${this.name}`,
      sha: shaNewCommit,
      force: options.force || false
    });

    return result.data;
  }

  /**
   * @see https://developer.github.com/v3/repos/contents/#get-repository-content
   * @param name
   */
  async entry(name) {
    const res = await this.provider.fetch(
      `/repos/${this.slug}/contents/${name}?ref=${this.ref}`
    );

    if (res.status != 200) {
      throw new Error(res.status);
    }
    const json = await res.json();

    return new this.entryClass(name, Buffer.from(json.content, "base64"));
  }

  /** @inheritdoc */
  async maybeEntry(name) {
    const res = await this.provider.fetch(
      `/repos/${this.slug}/contents/${name}?ref=${this.ref}`
    );
    if (res.status === 404) {
      return undefined;
    }

    const json = await res.json();
    return new this.entryClass(name, Buffer.from(json.content, "base64"));
  }

  /**
   * @see https://developer.github.com/v3/git/trees/
   * @param tree_sha
   */
  async tree(tree_sha) {
    const res = await this.provider.fetch(
      `/repos/${this.slug}/git/trees/${tree_sha}?recursive=1`
    );
    const json = await res.json();
    return json.tree;
  }

  async *entries(patterns) {
    const shaBaseTree = await this.baseTreeSha(await this.refId());

    for (const entry of matcher(await this.tree(shaBaseTree), patterns, {
      name: "path"
    })) {
      yield entry.type === "tree"
        ? new BaseCollectionEntry(entry.path)
        : new LazyBufferContentEntry(entry.path, this);
    }
  }

  /**
   * https://developer.github.com/v3/repos/contents/
   * @param {Iterator<ContentEntry>} entries
   */
  async removeEntires(entries) {
    for await (const entry of entries) {
      const res = await this.provider.fetch(
        `/repos/${this.slug}/contents/${entry.name}`,
        {
          method: "DELETE",
          body: JSON.stringify({ branch: this.name, message: "", sha: "" })
        }
      );
    }
  }

  get entryClass() {
    return BufferContentEntry;
  }
}

class LazyBufferContentEntry extends BufferContentEntryMixin(ContentEntry) {
  constructor(name, branch) {
    super(name);
    Object.defineProperties(this, {
      branch: { value: branch }
    });
  }

  async getBuffer() {
    const branch = this.branch;
    const res = await branch.provider.fetch(
      `/repos/${branch.slug}/contents/${this.name}?ref=${branch.ref}`
    );

    const json = await res.json();
    return Buffer.from(json.content, "base64");
  }
}
