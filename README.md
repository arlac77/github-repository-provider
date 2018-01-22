[![npm](https://img.shields.io/npm/v/github-repository-provider.svg)](https://www.npmjs.com/package/github-repository-provider)
[![Greenkeeper](https://badges.greenkeeper.io/arlac77/github-repository-provider.svg)](https://greenkeeper.io/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/arlac77/github-repository-provider)
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg)](https://github.com/prettier/prettier)
[![Build Status](https://secure.travis-ci.org/arlac77/github-repository-provider.png)](http://travis-ci.org/arlac77/github-repository-provider)
[![bithound](https://www.bithound.io/github/arlac77/github-repository-provider/badges/score.svg)](https://www.bithound.io/github/arlac77/github-repository-provider)
[![codecov.io](http://codecov.io/github/arlac77/github-repository-provider/coverage.svg?branch=master)](http://codecov.io/github/arlac77/github-repository-provider?branch=master)
[![Coverage Status](https://coveralls.io/repos/arlac77/github-repository-provider/badge.svg)](https://coveralls.io/r/arlac77/github-repository-provider)
[![Known Vulnerabilities](https://snyk.io/test/github/arlac77/github-repository-provider/badge.svg)](https://snyk.io/test/github/arlac77/github-repository-provider)
[![GitHub Issues](https://img.shields.io/github/issues/arlac77/github-repository-provider.svg?style=flat-square)](https://github.com/arlac77/github-repository-provider/issues)
[![Stories in Ready](https://badge.waffle.io/arlac77/github-repository-provider.svg?label=ready&title=Ready)](http://waffle.io/arlac77/github-repository-provider)
[![Dependency Status](https://david-dm.org/arlac77/github-repository-provider.svg)](https://david-dm.org/arlac77/github-repository-provider)
[![devDependency Status](https://david-dm.org/arlac77/github-repository-provider/dev-status.svg)](https://david-dm.org/arlac77/github-repository-provider#info=devDependencies)
[![docs](http://inch-ci.org/github/arlac77/github-repository-provider.svg?branch=master)](http://inch-ci.org/github/arlac77/github-repository-provider)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)
[![downloads](http://img.shields.io/npm/dm/github-repository-provider.svg?style=flat-square)](https://npmjs.org/package/github-repository-provider)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

# github-repository-provider

repository provider for github

# API

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### Table of Contents

-   [GithubProvider](#githubprovider)
    -   [url](#url)
    -   [repository](#repository)
    -   [checkForApiLimitError](#checkforapilimiterror)
    -   [options](#options)
-   [GithubRepository](#githubrepository)
    -   [owner](#owner)
    -   [initialize](#initialize)
    -   [urls](#urls)
    -   [issuesURL](#issuesurl)
-   [GithubBranch](#githubbranch)
    -   [writeBlob](#writeblob)
    -   [commit](#commit)
    -   [content](#content)

## GithubProvider

**Extends Provider**

GitHub provider

**Parameters**

-   `config`  

**Properties**

-   `client` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 
-   `rateLimitReached` **[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** 

### url

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** provider url

### repository

<!-- skip-example -->

Lookup a repository

**Parameters**

-   `name` **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

**Examples**

```javascript
import GithubProvider from 'github-repository-provider';

const ghp = new GithubProvider();
const r1 = ghp.repository('git@github.com:arlac77/github-repository-provider.git');
const r2 = ghp.repository('https://github.com/arlac77/github-repository-provider.git#master');
const r3 = ghp.repository('arlac77/github-repository-provider');
//three different ways to address the same repository
```

Returns **Repository** 

### checkForApiLimitError

Check for existense of an api rate limit Error
also sets rateLimitReached to true

**Parameters**

-   `err` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[boolean](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Boolean)>** true if api rate limit error present

### options

Pepare configuration by mixing together defaultOptions with actual options

**Parameters**

-   `config` **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** raw config

Returns **[Object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** combined options

## GithubRepository

**Extends Repository**

Repository on GitHub

**Parameters**

-   `provider`  
-   `name`  

### owner

Owner of the repository (first part of the name)

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

### initialize

Collect all branches

Returns **[Promise](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Promise)** 

### urls

Returns **[Array](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)>** github https url

### issuesURL

Deliver the url of issue tracking system.

Returns **[string](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String)** 

## GithubBranch

**Extends Branch**

Branch on GitHub

### writeBlob

**Parameters**

-   `blob` **Content** 

Returns **[object](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object)** 

### commit

**Parameters**

-   `message`  
-   `blobs`  
-   `options`   (optional, default `{}`)

### content

**Parameters**

-   `path`  
-   `options`   (optional, default `{}`)

# install

With [npm](http://npmjs.org) do:

```shell
npm install mock-repository-provider
```

# license

BSD-2-Clause
