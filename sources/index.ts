import { Hooks as CoreHooks, Plugin } from '@yarnpkg/core';
import { Hooks as PackHooks } from '@yarnpkg/plugin-pack';

import installHooks from './installHooks';
import packHooks from './packHooks';

export const dummyPkgDist = {
  shasum: "8835645b033793d09c5afb90ccee155b73b728f3",
  tarball: "https://registry.npmjs.org/optional-pkg/-/optional-pkg-1.0.0.tgz"
}, isDummyPkg = uri => /\/optional-pkg\/-\/optional-pkg-.*\.tgz$/.test(uri);

const plugin : Plugin<CoreHooks & PackHooks> = {
  hooks: {
    ...installHooks,
    ...packHooks
  }
};

export default plugin;
