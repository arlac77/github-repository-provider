import { Branch } from 'repository-provider';

/**
 * Branch on GitHub
 */
export class GithubBranch extends Branch {
  get client() {
    return this.provider.client;
  }

  /**
   * @param {Content} blob
   * @return {object}
   */
  async writeBlob(blob) {
    try {
      const path = blob.path.replace(/\\/g, '/').replace(/^\//, '');
      const mode = blob.mode || '100644';
      const type = blob.type || 'blob';

      const res = await this.client.post(
        `/repos/${this.repository.name}/git/blobs`,
        {
          content:
            typeof blob.content === 'string'
              ? blob.content
              : blob.content.toString('base64'),
          encoding: typeof blob.content === 'string' ? 'utf-8' : 'base64'
        }
      );

      return {
        path,
        mode,
        type,
        sha: res.sha
      };
    } catch (err) {
      await this.provider.checkForApiLimitError(err);
      throw err;
    }
  }

  async createPullRequest(to, msg) {
    try {
      const result = await this.client.post(
        `/repos/${this.repository.name}/pulls`,
        {
          title: msg.title,
          body: msg.body,
          base: this.name,
          head: to.name
        }
      );

      return new this.provider.pullRequestClass(this.repository, result.number);
    } catch (err) {
      await this.provider.checkForApiLimitError(err);
      throw err;
    }
  }

  async latestCommitSha() {
    const res = await this.client.get(
      `/repos/${this.repository.name}/git/refs/heads/${this.name}`
    );
    return res.object.sha;
  }

  async baseTreeSha(commitSha) {
    const res = await this.client.get(
      `/repos/${this.repository.name}/commits/${commitSha}`
    );

    return res.commit.tree.sha;
  }

  /** @inheritdoc */
  async commit(message, blobs, options = {}) {
    try {
      const updates = await Promise.all(blobs.map(b => this.writeBlob(b)));

      const shaLatestCommit = await this.latestCommitSha();
      const shaBaseTree = await this.baseTreeSha(shaLatestCommit);
      let res = await this.client.post(
        `/repos/${this.repository.name}/git/trees`,
        {
          tree: updates,
          base_tree: shaBaseTree
        }
      );
      const shaNewTree = res.sha;

      res = await this.client.post(
        `/repos/${this.repository.name}/git/commits`,
        {
          message,
          tree: shaNewTree,
          parents: [shaLatestCommit]
        }
      );
      const shaNewCommit = res.sha;

      res = await this.client.patch(
        `/repos/${this.repository.name}/git/refs/heads/${this.name}`,
        {
          sha: shaNewCommit,
          force: options.force || false
        }
      );

      return res;
    } catch (err) {
      await this.provider.checkForApiLimitError(err);
      throw err;
    }
  }

  /** @inheritdoc */
  async content(path, options = {}) {
    try {
      const res = await this.client.get(
        `/repos/${this.repository.name}/contents/${path}`,
        { ref: this.name }
      );
      const b = Buffer.from(res.content, 'base64');
      return b.toString();
    } catch (err) {
      await this.provider.checkForApiLimitError(err);

      if (options.ignoreMissing) {
        return '';
      }
      throw err;
    }
  }

  async tree(sha, prefix = '') {
    const list = [];

    const t = async (sha, prefix = '') => {
      const res = await this.client.get(
        `/repos/${this.repository.name}/git/trees/${sha}`
      );
      const files = res.tree;

      files.forEach(f => (f.path = prefix + f.path));

      list.push(...files);

      await Promise.all(
        files
          .filter(f => f.type === 'tree')
          .map(dir => t(dir.sha, prefix + dir.path + '/'))
      );
    };

    await t(sha, prefix);

    return list;
  }

  async list() {
    try {
      const shaBaseTree = await this.baseTreeSha(await this.latestCommitSha());
      return this.tree(shaBaseTree);
    } catch (err) {
      await this.provider.checkForApiLimitError(err);
      throw err;
    }
  }
}
