import { Branch } from "repository-provider";
import { BaseCollectionEntry } from "content-entry/src/base-collection-entry.mjs";
import { BufferContentEntry } from "content-entry/src/buffer-content-entry.mjs";
import { BufferContentEntryMixin } from "content-entry/src/buffer-content-entry-mixin.mjs";
import { ContentEntry } from "content-entry/src/content-entry.mjs";
import { GithubMixin } from "./github-mixin.mjs";
import micromatch from "micromatch";

/**
 * Branch on GitHub
 */
export class GithubBranch extends GithubMixin(Branch) {
  /**
   * writes content into the branch
   * @param {Entry[]} entry
   * @return {Promise<Entry[]>} written content with sha values set
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
  async commit(message, blobs, options = {}) {
    const updates = await Promise.all(blobs.map(b => this.writeEntry(b)));
    const shaLatestCommit = await this.refId();
    const shaBaseTree = await this.baseTreeSha(shaLatestCommit);

    let result = await this.octokit.git.createTree({
      owner: this.owner.name,
      repo: this.repository.name,
      tree: updates.map(u => {
        return { path: u.name, sha: u.sha, mode: u.mode || "100644" };
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

      const res = await this.octokit.repos.getContents({
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
      const res = await this.octokit.repos.getContents({
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

  /*
@see https://platform.github.community/t/how-can-build-a-tree-view-from-a-git-repository-tree/6003/2
MDM6UmVmMzY5MjUyNzQ6bWFzdGVy
query getOnlyRootFile {
  repository(owner: "s-xq", name: "github-android") {
    ref(qualifiedName: "refs/heads/master") {
      target {
        ... on Commit {
          tree {
            entries {
              name
              mode
              type
              object {
                ... on Tree {
                  entries {
                    name
                    mode
                    type
                    object {
                      ... on Tree {
                        entries {
                          name
                          mode
                          type
                          object {
                            ... on Tree {
                              oid
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
*/
  async tree(sha, prefix = "") {
    const list = [];

    const t = async (sha, prefix) => {
      const result = await this.octokit.git.getTree({
        owner: this.owner.name,
        repo: this.repository.name,
        tree_sha: sha,
        recursive: 1
      });
      const files = result.data.tree;

      files.forEach(f => {
        f.path = prefix + f.path;
      });

      list.push(...files);

      await Promise.all(
        files
          .filter(f => f.type === "tree")
          .map(dir => t(dir.sha, prefix + dir.path + "/"))
      );
    };

    await t(sha, prefix);

    return list;
  }

  async *entries(patterns) {
    const shaBaseTree = await this.baseTreeSha(await this.refId());
    for (const entry of await this.tree(shaBaseTree)) {
      if (
        patterns === undefined ||
        micromatch([entry.path], patterns).length === 1
      ) {
        if (entry.type === "tree") {
          yield new BaseCollectionEntry(entry.path);
        } else {
          yield new LazayBufferContentEntry(entry.path, this);
        }
      }
    }
  }

  get entryClass() {
    return BufferContentEntry;
  }
}

class LazayBufferContentEntry extends BufferContentEntryMixin(ContentEntry) {
  constructor(name, branch) {
    super(name);
    Object.defineProperties(this, {
      branch: { value: branch }
    });
  }

  async getBuffer() {
    const branch = this.branch;
    const res = await branch.octokit.repos.getContents({
      owner: branch.owner.name,
      repo: branch.repository.name,
      path: this.name,
      ref: branch.ref
    });
    return Buffer.from(res.data.content, "base64");
  }
}
