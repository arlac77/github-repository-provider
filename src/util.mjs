/**
'<https://api.github.com/repositories/253911783/pulls?page=1&state=OPEN&head=arlac77%3Apr-test%2Fsource-1>; rel="prev", <https://api.github.com/repositories/253911783/pulls?page=1&state=OPEN&head=arlac77%3Apr-test%2Fsource-1>; rel="last", <https://api.github.com/repositories/253911783/pulls?page=1&state=OPEN&head=arlac77%3Apr-test%2Fsource-1>; rel="first"',
*/
export function getLink(link, rel = "next") {
  const rels = decodeLinkHeader(link);
  if (link === undefined) {
    return undefined;
  }

  console.log(rels);

  return rels[rel];
}

export function decodeLinkHeader(link) {
  return link === undefined
    ? {}
    : Object.fromEntries(
        link.split(/\s*,\s*/).map(r => {
          const m = r.match(/<([^>]+)>;\s*rel="(\w+)"/);
          return [m[2], m[1]];
        })
      );
}
