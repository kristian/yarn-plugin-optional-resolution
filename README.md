# `@yarnpkg/plugin-better-optional`

Yarn Berry plugin that adds support for non-existing optional package dependencies. Without this plugin Yarn 2+ ("Berry") installing or adding an optional package which does not exist in the package repository will result in an error:

```
➤ YN0027: <pkg>@unknown can't be resolved to a satisfying range
➤ YN0035: The remote server failed to provide the requested resource
➤ YN0035:   Response Code: 404 (Not Found)
➤ YN0035:   Request Method: GET
➤ YN0035:   Request URL: https://registry.yarnpkg.com/<pkg>
```

This plugin changes this behavior in two ways:

  1. If an optional package requested from any defined NPM package registry (see [`npmRegistryServer`](https://yarnpkg.com/configuration/yarnrc#npmRegistryServer) and [`npmScopes`](https://yarnpkg.com/configuration/yarnrc#npmScopes)), would lead to a 404 (Not Found) error, this package instead, serves Yarn a "fake" / dummy package metadata file, leading to an [`optional-pkg`](https://www.npmjs.com/package/optional-pkg) instead, which satisfies the requested version range.

  2. Before packing, this plugin will "realize" all those optional, but non-existent, packages, by removing them from the `"optionalDependencies"` section before publishing. This allows others to consume the package, without requiring the better optional plugin.

This makes `"optionalDependencies"` truly optional, in a sense that they do not even need to exist, which behaves according to the [NPM package specification](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#optionaldependencies). Sometimes you favour a behavior like this, especially if you are working e.g. with multiple private package registries, that may, or may not contain certain package artifacts.

> ⚠️ There is a limitation for projects with *multiple workspaces* at the moment: As this plugin hooks into the network requests towards the NPM package registry and the hooking mechanism doesn't provide information for which workspace the request was made, this plugin assumes a package is optional, if it is mentioned in any `"optionalDependencies"` section of any of the workspace packages. Meaning that even if the package does not exist, installation would not fail for some workspaces, even if they declare the package as a hard dependency in their `"dependencies"` or `"devDependencies"` section.

## Installation

You can add this plugin to your Yarn 2+ ("Berry") project running the following command:

```bash
yarn plugin import https://raw.githubusercontent.com/kristian/yarn-plugin-better-optional/main/bundles/%40yarnpkg/plugin-better-optional.js
```

## Author

Written by [Kristian Kraljić](https://kra.lc/).

## Found a Bug?

Please file any issues [on Github](https://github.com/kristian/yarn-plugin-better-optional).

## License

This package is licensed under the [MIT](LICENSE) license.