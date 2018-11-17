import { Branch, Content } from "repository-provider";
import { GithubMixin } from "./github-mixin";
import micromatch from "micromatch";

/**
 * Branch on GitHub
 */
export class GithubBranch extends GithubMixin(Branch) {
  /**
   * writes content into the branch
   * @param {Content[]} content
   * @return {Promise<Content[]>} written content with sha values set
   */
  async writeContent(content) {
    try {
      const res = await this.octokit.gitdata.createBlob({
        owner: this.owner.name,
        repo: this.repository.name,
        content: content.toString(),
        encoding: "utf8"
      });

      content.sha = res.data.sha;

      return content;
    } catch (err) {
      await this.checkForApiLimitError(err);
      throw err;
    }
  }

  /**
   * @see https://octokit.github.io/rest.js/#api-PullRequests-create
   */
  async createPullRequest(destination, msg) {
    try {
      const options = {
        owner: this.owner.name,
        repo: this.repository.name,
        head: destination.name,
        base: this.name,
        title: msg.title,
        body: msg.body
      };

      const result = await this.octokit.pullRequests.create(options);
      return new this.pullRequestClass(
        this,
        destination,
        result.data.number,
        Object.assign(options, result.data)
      );
    } catch (err) {
      await this.checkForApiLimitError(err);
      throw err;
    }
  }

  async baseTreeSha(commitSha) {
    const result = await this.octokit.gitdata.getCommit({
      owner: this.owner.name,
      repo: this.repository.name,
      commit_sha: commitSha
    });
    return result.data.tree.sha;
  }

  /** @inheritdoc */
  async commit(message, blobs, options = {}) {
    try {
      const updates = await Promise.all(blobs.map(b => this.writeContent(b)));
      const shaLatestCommit = await this.refId();
      const shaBaseTree = await this.baseTreeSha(shaLatestCommit);

      let result = await this.octokit.gitdata.createTree({
        owner: this.owner.name,
        repo: this.repository.name,
        tree: updates,
        base_tree: shaBaseTree
      });
      const shaNewTree = result.data.sha;

      result = await this.octokit.gitdata.createCommit({
        owner: this.owner.name,
        repo: this.repository.name,
        message,
        tree: shaNewTree,
        parents: [shaLatestCommit]
      });
      const shaNewCommit = result.data.sha;

      result = await this.octokit.gitdata.updateReference({
        owner: this.owner.name,
        repo: this.repository.name,
        ref: `heads/${this.name}`,
        sha: shaNewCommit,
        force: options.force || false
      });
      return result.data;
    } catch (err) {
      await this.checkForApiLimitError(err);
      throw err;
    }
  }

  /** @inheritdoc */
  async content(name) {
    try {
      //const res = await this.octokit.gitdata.getBlob({owner:this.owner.name, repo:this.repository.name, file_sha});

      const res = await this.octokit.repos.getContent({
        owner: this.owner.name,
        repo: this.repository.name,
        path: name,
        ref: this.ref
      });

      return new Content(name, Buffer.from(res.data.content, "base64"));
    } catch (err) {
      await this.checkForApiLimitError(err);
      if (err.code === 404) {
        throw new Error(err.status);
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
      const result = await this.octokit.gitdata.getTree({
        owner: this.owner.name,
        repo: this.repository.name,
        tree_sha: sha,
        recursive: 1
      });
      const files = result.data.tree;

      files.forEach(f => (f.name = prefix + f.name));

      list.push(...files);

      await Promise.all(
        files
          .filter(f => f.type === "tree")
          .map(dir => t(dir.sha, prefix + dir.name + "/"))
      );
    };

    await t(sha, prefix);

    return list;
  }

  async *list(patterns) {
    try {
      const shaBaseTree = await this.baseTreeSha(await this.refId());
      for (const entry of await this.tree(shaBaseTree)) {
        if (patterns === undefined) {
          yield new Content(entry.name, undefined, entry.type, entry.mode);
        } else {
          if (micromatch([entry.name], patterns).length === 1) {
            yield new Content(entry.name, undefined, entry.type, entry.mode);
          }
        }
      }
    } catch (err) {
      await this.checkForApiLimitError(err);
      throw err;
    }
  }
}
