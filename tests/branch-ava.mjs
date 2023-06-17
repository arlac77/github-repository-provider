import test from "ava";
import {
    assertBranchUpdateAttributes,
    REPOSITORY_NAME,
    createMessageDestination
  } from "repository-provider-test-support";
  import GithubProvider from "github-repository-provider";
  

const messageDestination = createMessageDestination().messageDestination;
const provider = GithubProvider.initialize({ messageDestination }, process.env);

test("branch update", async t => {
  const branch = await provider.branch(REPOSITORY_NAME);
  await assertBranchUpdateAttributes(t, branch);
});
