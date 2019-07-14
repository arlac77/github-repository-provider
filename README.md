[![npm](https://img.shields.io/npm/v/github-repository-provider.svg)](https://www.npmjs.com/package/github-repository-provider)
[![Greenkeeper](https://badges.greenkeeper.io/arlac77/github-repository-provider.svg)](https://greenkeeper.io/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/arlac77/github-repository-provider)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Build Status](https://secure.travis-ci.org/arlac77/github-repository-provider.png)](http://travis-ci.org/arlac77/github-repository-provider)
[![codecov.io](http://codecov.io/github/arlac77/github-repository-provider/coverage.svg?branch=master)](http://codecov.io/github/arlac77/github-repository-provider?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/arlac77/github-repository-provider/badge.svg)](https://snyk.io/test/github/arlac77/github-repository-provider)
[![GitHub Issues](https://img.shields.io/github/issues/arlac77/github-repository-provider.svg?style=flat-square)](https://github.com/arlac77/github-repository-provider/issues)
[![Dependency Status](https://david-dm.org/arlac77/github-repository-provider.svg)](https://david-dm.org/arlac77/github-repository-provider)
[![devDependency Status](https://david-dm.org/arlac77/github-repository-provider/dev-status.svg)](https://david-dm.org/arlac77/github-repository-provider#info=devDependencies)
[![docs](http://inch-ci.org/github/arlac77/github-repository-provider.svg?branch=master)](http://inch-ci.org/github/arlac77/github-repository-provider)
[![downloads](http://img.shields.io/npm/dm/github-repository-provider.svg?style=flat-square)](https://npmjs.org/package/github-repository-provider)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# github-repository-provider

repository provider for github

<!-- skip example -->

´´´es6
import { GithubProvider } from 'github-repository-provider';

const config = GithubProvider.optionsFromEnvironment(process.env);
const provider = new GithubProvider(config);
const repository = await provider.repository(`myuser/repo1`);

for async (const entry of repository.entries('\*_/_.md')) {
    console.log(entry.name);
}
´´´

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [GithubProvider](#githubprovider)
    -   [Parameters](#parameters)
    -   [Properties](#properties)
    -   [Examples](#examples)
    -   [repositories](#repositories)
        -   [Parameters](#parameters-1)
    -   [branches](#branches)
        -   [Parameters](#parameters-2)
    -   [repositoryBases](#repositorybases)
    -   [rateLimit](#ratelimit)
    -   [environmentOptions](#environmentoptions)
-   [GithubRepository](#githubrepository)
    -   [urls](#urls)
    -   [issuesURL](#issuesurl)
    -   [homePageURL](#homepageurl)
    -   [refId](#refid)
        -   [Parameters](#parameters-3)
-   [GithubMixin](#githubmixin)
-   [GithubBranch](#githubbranch)
    -   [writeEntry](#writeentry)
        -   [Parameters](#parameters-4)
    -   [createPullRequest](#createpullrequest)
        -   [Parameters](#parameters-5)
    -   [commit](#commit)
        -   [Parameters](#parameters-6)
    -   [entry](#entry)
        -   [Parameters](#parameters-7)
    -   [maybeEntry](#maybeentry)
        -   [Parameters](#parameters-8)
-   [GithubOwner](#githubowner)
-   [GithubPullRequest](#githubpullrequest)
    -   [\_merge](#_merge)
        -   [Parameters](#parameters-9)
    -   [validMergeMethods](#validmergemethods)

## GithubProvider

**Extends Provider**

<!-- skip-example -->

GitHub provider
Lookup a repository

### Parameters

-   `options`  

### Properties

-   `octokit` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

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

### repositories

List repositories of the provider

#### Parameters

-   `patterns` **([Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)> | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String))** 

Returns **Iterator&lt;Repository>** all matching repositories of the provider

### branches

List branches of the provider

#### Parameters

-   `patterns` **([Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)> | [string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String))** 

Returns **Iterator&lt;Branch>** all matching repositories of the provider

### repositoryBases

All possible base urls

-   git@github.com
-   git://github.com
-   git+ssh://github.com
-   <https://github.com>
-   git+<https://github.com>

Returns **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** common base urls of all repositories

### rateLimit

Query the current rate limit

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** rate limit (remaining)

### environmentOptions

known environment variables

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** GITHUB_TOKEN api token

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** GH_TOKEN api token

## GithubRepository

**Extends GithubMixin(Repository)**

Repository on GitHub

### urls

Returns **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** github https url

### issuesURL

Deliver the url of issue tracking system.

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### homePageURL

Deliver the url of the repositories home page.

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### refId

#### Parameters

-   `ref` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** sha of the ref

## GithubMixin

common stuff for all github objects

## GithubBranch

**Extends GithubMixin(Branch)**

Branch on GitHub

### writeEntry

writes content into the branch

#### Parameters

-   `entry` **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;Entry>** 

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;Entry>>** written content with sha values set

### createPullRequest

-   **See: <https://octokit.github.io/rest.js/#api-PullRequests-create>**

#### Parameters

-   `destination`  
-   `msg`  

### commit

#### Parameters

-   `message`  
-   `blobs`  
-   `options`   (optional, default `{}`)

### entry

#### Parameters

-   `name`  

### maybeEntry

#### Parameters

-   `name`  

## GithubOwner

**Extends GithubMixin(RepositoryGroup)**

## GithubPullRequest

**Extends GithubMixin(PullRequest)**

Github pull request

### \_merge

-   **See: <https://octokit.github.io/rest.js/#api-PullRequests-merge>**

#### Parameters

-   `method`   (optional, default `"MERGE"`)

### validMergeMethods

All valid merge methods

Returns **[Set](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Set)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** valid merge methods

# install

With [npm](http://npmjs.org) do:

```shell
npm install mock-repository-provider
```

# license

BSD-2-Clause
