[![npm](https://img.shields.io/npm/v/github-repository-provider.svg)](https://www.npmjs.com/package/github-repository-provider)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![minified size](https://badgen.net/bundlephobia/min/github-repository-provider)](https://bundlephobia.com/result?p=github-repository-provider)
[![downloads](http://img.shields.io/npm/dm/github-repository-provider.svg?style=flat-square)](https://npmjs.org/package/github-repository-provider)
[![GitHub Issues](https://img.shields.io/github/issues/arlac77/github-repository-provider.svg?style=flat-square)](https://github.com/arlac77/github-repository-provider/issues)
[![Build Status](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Factions-badge.atrox.dev%2Farlac77%2Fgithub-repository-provider%2Fbadge\&style=flat)](https://actions-badge.atrox.dev/arlac77/github-repository-provider/goto)
[![Styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Known Vulnerabilities](https://snyk.io/test/github/arlac77/github-repository-provider/badge.svg)](https://snyk.io/test/github/arlac77/github-repository-provider)
[![Coverage Status](https://coveralls.io/repos/arlac77/github-repository-provider/badge.svg)](https://coveralls.io/github/arlac77/github-repository-provider)

# github-repository-provider

repository provider for github

<!-- skip example -->

```javascript
import { GithubProvider } from 'github-repository-provider';

const config = GithubProvider.optionsFromEnvironment(process.env);
const provider = new GithubProvider(config);
const repository = await provider.repository(`myuser/repo1`);

for async (const entry of repository.entries('\*_/_.md')) {
console.log(entry.name);
}
```

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

*   [GithubBranch](#githubbranch)
    *   [writeEntry](#writeentry)
        *   [Parameters](#parameters)
    *   [commit](#commit)
        *   [Parameters](#parameters-1)
    *   [entry](#entry)
        *   [Parameters](#parameters-2)
    *   [commitForSha](#commitforsha)
        *   [Parameters](#parameters-3)
    *   [tree](#tree)
        *   [Parameters](#parameters-4)
    *   [removeEntries](#removeentries)
        *   [Parameters](#parameters-5)
*   [GithubOwner](#githubowner)
    *   [createRepository](#createrepository)
        *   [Parameters](#parameters-6)
    *   [deleteRepository](#deleterepository)
        *   [Parameters](#parameters-7)
    *   [attributeMapping](#attributemapping)
*   [GithubProvider](#githubprovider)
    *   [Examples](#examples)
    *   [initializeRepositories](#initializerepositories)
    *   [repositoryBases](#repositorybases)
    *   [name](#name)
    *   [instanceIdentifier](#instanceidentifier)
*   [GithubPullRequest](#githubpullrequest)
    *   [\_merge](#\_merge)
        *   [Parameters](#parameters-8)
    *   [\_write](#\_write)
    *   [validMergeMethods](#validmergemethods)
    *   [list](#list)
        *   [Parameters](#parameters-9)
    *   [open](#open)
        *   [Parameters](#parameters-10)
*   [GithubRepository](#githubrepository)
    *   [initializeBranches](#initializebranches)
    *   [initializeTags](#initializetags)
    *   [urls](#urls)
    *   [issuesURL](#issuesurl)
    *   [homePageURL](#homepageurl)
    *   [update](#update)
    *   [refId](#refid)
        *   [Parameters](#parameters-11)
    *   [deletePullRequest](#deletepullrequest)
        *   [Parameters](#parameters-12)
    *   [initializeHooks](#initializehooks)

## GithubBranch

**Extends Branch**

Branch on GitHub.

### writeEntry

Writes content into the branch
<https://developer.github.com/v3/git/blobs/#get-a-blob>

#### Parameters

*   `entry` **ConentEntry** 

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)\<ContentEntry>** written content with sha values set

### commit

<https://developer.github.com/v3/git/trees/#create-a-tree>
<https://developer.github.com/v3/git/commits/#create-a-commit>
<https://developer.github.com/v3/git/refs/#update-a-reference>

#### Parameters

*   `message` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
*   `entries` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)\<ContentEntry>** 
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)

### entry

<https://developer.github.com/v3/repos/contents/#get-repository-content>

#### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### commitForSha

<https://developer.github.com/v3/git/commits/#get-a-commit>

#### Parameters

*   `sha` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** response

### tree

*   **See**: <https://developer.github.com/v3/git/trees/>

#### Parameters

*   `sha` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)>** 

### removeEntries

<https://developer.github.com/v3/repos/contents/>

#### Parameters

*   `entries` **Iterator\<ContentEntry>** 

## GithubOwner

**Extends RepositoryGroup**

Represents github repo owner either

*   users
*   organization

### createRepository

<https://developer.github.com/v3/repos/#create-a-repository-for-the-authenticated-user>

#### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)

Returns **Repository** newly created repository

### deleteRepository

<https://developer.github.com/v3/repos/#delete-a-repository>

#### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### attributeMapping

Map attributes between external and internal representation.

## GithubProvider

**Extends MultiGroupProvider**

<!-- skip-example -->

GitHub provider.
Lookup a repository.
known environment variables

*   GITHUB_TOKEN or GH_TOKEN api token

### Examples

```javascript
import GithubProvider from 'github-repository-provider';

const ghp = new GithubProvider();
const r1 = ghp.repository('git@github.com:arlac77/github-repository-provider.git');
const r2 = ghp.repository('git://github.com/arlac77/github-repository-provider.git');
const r3 = ghp.repository('git+ssh://github.com/arlac77/github-repository-provider.git');
const r4 = ghp.repository('https://github.com/arlac77/github-repository-provider.git#master');
const r5 = ghp.repository('git+https://github.com/arlac77/github-repository-provider.git#master');
const r6 = ghp.repository('arlac77/github-repository-provider');
// different ways to address the same repository
```

### initializeRepositories

<https://developer.github.com/v3/repos/#list-repositories-for-the-authenticated-user>

### repositoryBases

All possible base urls

*   github:
*   <git@github.com>
*   git://github.com
*   git+ssh://github.com
*   <https://github.com>
*   git+<https://github.com>

Returns **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** common base urls of all repositories

### name

We are called github.

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** github

### instanceIdentifier

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** default environment name prefix for the provider instance

## GithubPullRequest

**Extends PullRequest**

Github pull request.

### \_merge

<https://developer.github.com/v3/pulls/#merge-a-pull-request>

#### Parameters

*   `method`   (optional, default `"MERGE"`)

### \_write

### validMergeMethods

All valid merge methods.

Returns **[Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** valid merge methods

### list

<https://developer.github.com/v3/pulls/#list-pull-requests>

#### Parameters

*   `repository` **Repository** 
*   `filter` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)**  (optional, default `{}`)

### open

<https://developer.github.com/v3/pulls/#create-a-pull-request>

#### Parameters

*   `source` **Branch** 
*   `destination` **Branch** 
*   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

## GithubRepository

**Extends Repository**

Repository on GitHub.

### initializeBranches

<https://developer.github.com/v3/repos/branches/#list-branches>

### initializeTags

<https://docs.github.com/en/rest/reference/repos#list-repository-tags>

### urls

Returns **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** github https url

### issuesURL

Deliver the url of issue tracking system.

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### homePageURL

Deliver the url of the repositories home page.

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### update

<https://developer.github.com/v3/repos/#update-a-repository>

### refId

Get sha of a ref.
<https://developer.github.com/v3/git/refs/>

#### Parameters

*   `ref` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)<[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** sha of the ref

### deletePullRequest

<https://developer.github.com/v3/pulls/#update-a-pull-request>

#### Parameters

*   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### initializeHooks

<https://developer.github.com/v3/repos/hooks/>

# install

With [npm](http://npmjs.org) do:

```shell
npm install github-repository-provider
```

# license

BSD-2-Clause