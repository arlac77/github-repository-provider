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
  /**
   * writes content into the branch
   * @param {Entry} entry
   * @return {Promise<Entry>} written content with sha values set
   */
  async writeEntry(entry) {
    const res = await this.octokit.git.createBlob({
      owner: this.owner.name,
      repo: this.repository.name,
      content: await entry.getString(),
      encoding: "utf8"
    });

    entry.sha = res.data.sha;

    return entry;
  }

  /**
   * @see https://octokit.github.io/rest.js/#api-PullRequests-create
   */
  async createPullRequest(destination, msg) {
    const options = {
      owner: this.owner.name,
      repo: this.repository.name,
      title: msg.title,
      head: destination.name,
      base: this.name,
      body: msg.body
    };

    const result = await this.octokit.pulls.create(options);

    /*
    delete result.data.base;
    delete result.data.head;
*/

    return new this.pullRequestClass(this, destination, result.data.number, {
      ...options,
      ...result.data
    });
  }

  async baseTreeSha(commitSha) {
    const result = await this.octokit.git.getCommit({
      owner: this.owner.name,
      repo: this.repository.name,
      commit_sha: commitSha
    });
    return result.data.tree.sha;
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

  /** @inheritdoc */
  async entry(name) {
    try {
      //const res = await this.octokit.git.getBlob({owner:this.owner.name, repo:this.repository.name, file_sha});

      const res = await this.octokit.repos.getContent({
        owner: this.owner.name,
        repo: this.repository.name,
        path: name,
        ref: this.ref
      });

      return new this.entryClass(name, Buffer.from(res.data.content, "base64"));
    } catch (err) {
      if (err.status === 404) {
        throw new Error(err.status);
      }
      throw err;
    }
  }

  /** @inheritdoc */
  async maybeEntry(name) {
    try {
      const res = await this.octokit.repos.getContent({
        owner: this.owner.name,
        repo: this.repository.name,
        path: name,
        ref: this.ref
      });

      return new this.entryClass(name, Buffer.from(res.data.content, "base64"));
    } catch (err) {
      if (err.status === 404) {
        return undefined;
      }
      throw err;
    }
  }

  async tree(tree_sha) {
    const result = await this.octokit.git.getTree({
      owner: this.owner.name,
      repo: this.repository.name,
      tree_sha,
      recursive: 1
    });
    return result.data.tree;
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
      await this.octokit.repos.deleteFile({
        owner: this.owner.name,
        repo: this.repository.name,
        path: entry.name
        // message,
        // sha
      });
    }

    // DELETE /repos/:owner/:repo/contents/:path
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
    const res = await branch.octokit.repos.getContent({
      owner: branch.owner.name,
      repo: branch.repository.name,
      path: this.name,
      ref: branch.ref
    });
    return Buffer.from(res.data.content, "base64");
  }
}
