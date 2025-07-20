import test from "ava";
import { createMessageDestination, REPOSITORY_NAME } from "repository-provider-test-support";
import levelup from "levelup";
import leveldown from "leveldown";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { ETagCacheLevelDB } from "etag-cache-leveldb";
import GithubProvider from "github-repository-provider";

async function createCache() {
  const dir = join(new URL("../build/cache", import.meta.url).pathname);
  await mkdir(dir, { recursive: true });
  const db = await levelup(leveldown(dir));
  return new ETagCacheLevelDB(db);
}

const messageDestination = createMessageDestination().messageDestination;

test.skip("provider with cache", async t => {
  const provider = GithubProvider.initialize(
    { messageDestination },
    process.env
  );
  provider.cache = await createCache();

  const repository = await provider.repository(
    "https://github.com/" + REPOSITORY_NAME
  );

  t.truthy(repository);

});
