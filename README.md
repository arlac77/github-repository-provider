[![npm](https://img.shields.io/npm/v/github-repository-provider.svg)](https://www.npmjs.com/package/github-repository-provider)
[![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)
[![minified size](https://badgen.net/bundlephobia/min/github-repository-provider)](https://bundlephobia.com/result?p=github-repository-provider)
[![downloads](http://img.shields.io/npm/dm/github-repository-provider.svg?style=flat-square)](https://npmjs.org/package/github-repository-provider)
[![GitHub Issues](https://img.shields.io/github/issues/arlac77/github-repository-provider.svg?style=flat-square)](https://github.com/arlac77/github-repository-provider/issues)
[![Build Status](https://travis-ci.com/arlac77/github-repository-provider.svg?branch=master)](https://travis-ci.com/arlac77/github-repository-provider)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/arlac77/github-repository-provider.git)
[![Styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![Known Vulnerabilities](https://snyk.io/test/github/arlac77/github-repository-provider/badge.svg)](https://snyk.io/test/github/arlac77/github-repository-provider)
[![Coverage Status](https://coveralls.io/repos/arlac77/github-repository-provider/badge.svg)](https://coveralls.io/r/arlac77/github-repository-provider)

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

-   [GithubProvider](#githubprovider)
    -   [Parameters](#parameters)
    -   [Examples](#examples)
    -   [initializeRepositories](#initializerepositories)
    -   [repositoryBases](#repositorybases)
-   [GithubRepository](#githubrepository)
    -   [initializeBranches](#initializebranches)
    -   [urls](#urls)
    -   [issuesURL](#issuesurl)
    -   [homePageURL](#homepageurl)
    -   [update](#update)
    -   [refId](#refid)
        -   [Parameters](#parameters-1)
    -   [deletePullRequest](#deletepullrequest)
        -   [Parameters](#parameters-2)
    -   [initializeHooks](#initializehooks)
-   [GithubBranch](#githubbranch)
    -   [writeEntry](#writeentry)
        -   [Parameters](#parameters-3)
    -   [createPullRequest](#createpullrequest)
        -   [Parameters](#parameters-4)
    -   [baseTreeSha](#basetreesha)
        -   [Parameters](#parameters-5)
    -   [commit](#commit)
        -   [Parameters](#parameters-6)
    -   [entry](#entry)
        -   [Parameters](#parameters-7)
    -   [maybeEntry](#maybeentry)
        -   [Parameters](#parameters-8)
    -   [tree](#tree)
        -   [Parameters](#parameters-9)
    -   [removeEntires](#removeentires)
        -   [Parameters](#parameters-10)
-   [GithubOwner](#githubowner)
    -   [deleteRepository](#deleterepository)
        -   [Parameters](#parameters-11)
-   [GithubPullRequest](#githubpullrequest)
    -   [\_merge](#_merge)
        -   [Parameters](#parameters-12)
    -   [\_write](#_write)
    -   [validMergeMethods](#validmergemethods)
    -   [fetch](#fetch)
        -   [Parameters](#parameters-13)
    -   [list](#list)
        -   [Parameters](#parameters-14)
    -   [open](#open)
        -   [Parameters](#parameters-15)

## GithubProvider

**Extends MultiGroupProvider**

<!-- skip-example -->

GitHub provider
Lookup a repository
known environment variables

-   GITHUB_TOKEN or GH_TOKEN api token

### Parameters

-   `options`  

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

-   **See: <https://developer.github.com/v3/repos/#list-repositories-for-the-authenticated-user>
    **

### repositoryBases

All possible base urls

-   git@github.com
-   git://github.com
-   git+ssh://github.com
-   <https://github.com>
-   git+<https://github.com>

Returns **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** common base urls of all repositories

## GithubRepository

**Extends Repository**

Repository on GitHub

### initializeBranches

-   **See: <https://developer.github.com/v3/repos/branches/#list-branches>
    **

### urls

Returns **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** github https url

### issuesURL

Deliver the url of issue tracking system.

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### homePageURL

Deliver the url of the repositories home page.

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### update

-   **See: <https://developer.github.com/v3/repos/#update-a-repository>
    **

### refId

-   **See: <https://developer.github.com/v3/git/refs/>
    **

#### Parameters

-   `ref` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** sha of the ref

### deletePullRequest

-   **See: <https://developer.github.com/v3/pulls/#update-a-pull-request>
    **

#### Parameters

-   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### initializeHooks

-   **See: <https://developer.github.com/v3/repos/hooks/>
    **

## GithubBranch

**Extends Branch**

Branch on GitHub

### writeEntry

-   **See: <https://developer.github.com/v3/git/blobs/#get-a-blob>
    **

Writes content into the branch

#### Parameters

-   `entry` **Entry** 

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;Entry>** written content with sha values set

### createPullRequest

#### Parameters

-   `destination`  
-   `msg`  

### baseTreeSha

-   **See: <https://developer.github.com/v3/git/commits/#get-a-commit>
    **

#### Parameters

-   `sha` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### commit

-   **See: <https://developer.github.com/v3/git/trees/#create-a-tree>
    **
-   **See: <https://developer.github.com/v3/git/commits/#create-a-commit>
    **
-   **See: <https://developer.github.com/v3/git/refs/#update-a-reference>
    **

#### Parameters

-   `message`  
-   `entries`  
-   `options`   (optional, default `{}`)

### entry

-   **See: <https://developer.github.com/v3/repos/contents/#get-repository-content>
    **

#### Parameters

-   `name`  

### maybeEntry

#### Parameters

-   `name`  

### tree

-   **See: <https://developer.github.com/v3/git/trees/>
    **

#### Parameters

-   `tree_sha`  

### removeEntires

<https://developer.github.com/v3/repos/contents/>

#### Parameters

-   `entries` **Iterator&lt;ContentEntry>** 

## GithubOwner

**Extends RepositoryGroup**

-   **See: <https://developer.github.com/v3/repos/#create-a-repository-for-the-authenticated-user>
    **

### deleteRepository

-   **See: <https://developer.github.com/v3/repos/#delete-a-repository>
    **

#### Parameters

-   `name`  

## GithubPullRequest

**Extends PullRequest**

Github pull request

### \_merge

-   **See: <https://developer.github.com/v3/pulls/#merge-a-pull-request>
    **

#### Parameters

-   `method`   (optional, default `"MERGE"`)

### \_write

### validMergeMethods

All valid merge methods

Returns **[Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** valid merge methods

### fetch

-   **See: <https://developer.github.com/v3/pulls/#pull-requests>
    **

#### Parameters

-   `repository`  
-   `number`  

### list

-   **See: <https://developer.github.com/v3/pulls/#list-pull-requests>
    **

#### Parameters

-   `repository`  
-   `filter`   (optional, default `{}`)

### open

-   **See: <https://developer.github.com/v3/pulls/#create-a-pull-request>
    **

#### Parameters

-   `source` **Branch** 
-   `destination` **Branch** 
-   `options` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

# install

With [npm](http://npmjs.org) do:

```shell
npm install mock-repository-provider
```

# license

BSD-2-Clause
