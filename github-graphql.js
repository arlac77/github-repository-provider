
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

/*export*/ async function getBranches(github, login, repository) {
  const data = await github.query(
    `query {
    repositoryOwner(login: "${login}") {
      repository(name: "${repository}") {
        refs(first: 100, refPrefix:"refs/heads/") {
          edges {
            node {
              name
            }
          }
        }
      }
    }
  }`
  );
  return data.data.repositoryOwner.repository.refs.edges.map(d => d.node.name);
}

if (false) {
  github.query(
    `query {
    repositoryOwner(login: "${login}") {
      repository(name: "${repository}") {
        issues(last: 3) {
          edges {
            node {
              title
            }
          }
        }
      }
    }
  }`,
    null,
    (res, err) => {
      console.log(JSON.stringify(res, null, 2));
    }
  );

  github.query(
    `{
	viewer {
	  login
	}
}`,
    null,
    (res, err) => {
      console.log(JSON.stringify(res, null, 2));
    }
  );
}
