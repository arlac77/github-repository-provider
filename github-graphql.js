
query {
  repository(owner:"arlac77", name: "uti") {
    description
    primaryLanguage {
      name
    }
    pullRequests(first: 5 ) {
      nodes { id  author { login} }
    }
  }
}

/*export*/ async function getPullRequests(github, login, repository) {
  const data = await github.query(
    `query {
  repositoryOwner(login: "${login}") {
    repository(name: "${repository}") {
      pullRequests(first: 10) {
        edges {
          node {
            commits(first: 10) {
              nodes {
                url
              }
            }
            author {
              login
            }
            bodyText
            number
            closed
          }
        }
      }
    }
  }
}`
  );
  return data.data.repositoryOwner.repository.pullRequests.edges;
}
