import { Branch, Content } from "repository-provider";
import { GithubMixin } from "./github-mixin";
import micromatch from "micromatch";

/**
 * Branch on GitHub
 */
export class GithubBranch extends GithubMixin(Branch) {
  /**
   * @param {Content} content
   * @return {Object}
   */
  async writeContent(content) {
    try {
      const res = await this.client.post(
        `/repos/${this.repository.fullName}/git/blobs`,
        {
          content:
            typeof content.content === "string"
              ? content.content
              : content.content.toString("base64"),
          encoding: typeof content.content === "string" ? "utf-8" : "base64"
        }
      );
      return {
        path: content.path,
        mode: content.mode,
        type: content.type,
        sha: res.sha
      };
    } catch (err) {
      await this.checkForApiLimitError(err);
      throw err;
    }
  }

  /**
   * @see https://octokit.github.io/rest.js/#api-PullRequests-create
   */
  async createPullRequest(to, msg) {
    try {
      /*
      const result = await this.octokit.pullRequests.create({
        owner: this.owner.name,
        repo: this.repository,
        head: to.name,
        base: this.name,
        title: msg.title,
        body: msg.body
      });
*/

      const prOptions = {
        title: msg.title,
        body: msg.body,
        base: this.name,
        head: to.name
      };

      const result = await this.client.post(
        `/repos/${this.repository.fullName}/pulls`,
        prOptions
      );
      return new this.pullRequestClass(
        this.repository,
        result.number,
        prOptions
      );
    } catch (err) {
      await this.checkForApiLimitError(err);
      throw err;
    }
  }

  async baseTreeSha(commitSha) {
    const res = await this.client.get(
      `/repos/${this.repository.fullName}/commits/${commitSha}`
    );

    return res.commit.tree.sha;
  }

  /** @inheritdoc */
  async commit(message, blobs, options = {}) {
    try {
      const updates = await Promise.all(blobs.map(b => this.writeContent(b)));

      const shaLatestCommit = await this.refId();
      const shaBaseTree = await this.baseTreeSha(shaLatestCommit);
      let res = await this.client.post(
        `/repos/${this.repository.fullName}/git/trees`,
        {
          tree: updates,
          base_tree: shaBaseTree
        }
      );
      const shaNewTree = res.sha;

      res = await this.client.post(
        `/repos/${this.repository.fullName}/git/commits`,
        {
          message,
          tree: shaNewTree,
          parents: [shaLatestCommit]
        }
      );
      const shaNewCommit = res.sha;

      res = await this.client.patch(
        `/repos/${this.repository.fullName}/git/refs/heads/${this.name}`,
        {
          sha: shaNewCommit,
          force: options.force || false
        }
      );

      return res;
    } catch (err) {
      await this.checkForApiLimitError(err);
      throw err;
    }
  }

  /** @inheritdoc */
  async content(path, options = {}) {
    try {
      //const res = await this.octokit.gitdata.getBlob({owner:this.owner.name, repo:this.repository.name, file_sha});

      const res = await this.octokit.repos.getContent({
        owner: this.owner.name,
        repo: this.repository.name,
        path,
        ref: this.ref
      });

      const b = Buffer.from(res.data.content, "base64");
      return new Content(path, b.toString());
    } catch (err) {
      await this.checkForApiLimitError(err);

      if (options.ignoreMissing) {
        return new Content(path, "");
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
      const res = await this.client.get(
        `/repos/${this.repository.fullName}/git/trees/${sha}`
      );
      const files = res.tree;

      files.forEach(f => (f.path = prefix + f.path));

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

  async *list(patterns) {
    try {
      const shaBaseTree = await this.baseTreeSha(await this.refId());
      for (const entry of await this.tree(shaBaseTree)) {
        if (patterns === undefined) {
          yield new Content(entry.path, undefined, entry.type, entry.mode);
        } else {
          if (micromatch([entry.path], patterns).length === 1) {
            yield new Content(entry.path, undefined, entry.type, entry.mode);
          }
        }
      }
    } catch (err) {
      await this.checkForApiLimitError(err);
      throw err;
    }
  }
}
