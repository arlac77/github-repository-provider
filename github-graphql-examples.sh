

curl -H "Authorization: bearer $GH_TOKEN" -X POST -d '
{
 "query": "query { viewer { login }}"
}
' https://api.github.com/graphql
