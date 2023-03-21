import { Hooks as CoreHooks, Workspace, structUtils } from '@yarnpkg/core';
import { /* just for type declarations */ } from '@yarnpkg/plugin-npm';
import { minVersion, minSatisfying, rsort } from 'semver';
import { dummyPkgDist } from './index';

const findOptionalDependenciesInWorkspace = (workspace: Workspace) : Map<string, string> => {  
  // this includes optional, Yarn doesn't make any difference (that's the reason why to go for better-optional ;), we do!)
  const dependencies = Array.from(workspace.manifest.getForScope(`dependencies`).values());

  // if a package.json contains (even yet uninstalled) optional packages or a yarn add with the --optional flag
  // is executed, the dependenciesMeta object of the workspace manifest will be pre-populated with the package
  const optionalPkgs = new Map<string, string>();
  for (const [pkg, depMeta] of workspace.manifest.dependenciesMeta?.entries()) {
    if (depMeta.get(null)?.optional) {
      const ident = structUtils.parseIdent(pkg);
      optionalPkgs.set(pkg, dependencies.find(dep =>
        dep.scope === ident.scope && dep.name === ident.name).range);
    }
  } return optionalPkgs;
};

let optionalPkgs : Map<string, Set<string>>;
const hooks : CoreHooks = {
  validateWorkspace: workspace => {
    if (!optionalPkgs) {
      optionalPkgs = new Map(Array.from(findOptionalDependenciesInWorkspace(workspace)
        .entries()).map(([pkg, range]) => ([pkg, new Set([range])])));
    } else {
      // project with multiple workspaces, because of the limitation that in the warpNetworkRequest we do not know from which workspace
      // the request was made, we consider a package optional, if it is listed in the `optionalDependencies` section of any workspace.
      // if multiple workspaces define the same package in their "optionalDependencies" section, we will serve all requested versions in
      // our fake metadata quest. in that case the map value will be changed to an array of all requested version (ranges).
      for (const [pkg, range] of findOptionalDependenciesInWorkspace(workspace)) {
        optionalPkgs.set(pkg, !optionalPkgs.has(pkg) ? new Set([range]) : new Set([range, ...optionalPkgs.get(pkg)]));
      }
    }
  },
  wrapNetworkRequest: async (executor, extra) => {
    // the validateWorkspace hook will only get called on 'install' and if 'add' defines a version. if add is called without
    // a version (or range), Yarn will try to determine the latest version first, without calling validateWorkspace. to overcome
    // that we simply assume that if --optional, the -O flag is set on the command line, every network request until the validateWorkspace
    // hook is called, is to validate / fetch the "latest" version of a package (which, if non-existent we can freely pick!)
    const optionalArg = optionalPkgs ? undefined : (process.argv.includes(`--optional`) || process.argv.includes(`-O`));

    // check if extra.target points to a package registry and if so, to which package range
    let pkg : string, ranges : string[], target = extra.target.toString();
    const registry = [extra.configuration.get(`npmRegistryServer`), ...Array.from(extra.configuration.get(`npmScopes`).values())
      .map(scope => scope.get(`npmRegistryServer`))].find(registry => registry && target.startsWith(registry));
    if (registry) {
      target = target.substring(registry.length + (registry.endsWith(`/`) ? 0 : 1));

      // cut of the query part, we are not interested!
      const query = target.indexOf(`?`);
      if (query > -1) {
        target = target.substring(0, query);
      }

      // if the path contains any further slashes, we are NOT interested in it, because we only want to track requests
      // to the metadata, which NPM URLs are <registry URL>/<package name>, so if it is any sub-path, we are not interested!
      const slash = target.indexOf(`/`);
      if (slash <= -1) {
        pkg = decodeURIComponent(target);
        if ((optionalPkgs && optionalPkgs.has(pkg))) {
          ranges = Array.from(optionalPkgs.get(pkg));
        } else if (optionalArg) {
          ranges = [`0.0.0`];
        } else {
          pkg = undefined;
        }
      }
    }

    // it is not a metadata request, or none to fetch an optional package, so normal execution!
    if (!ranges) {
      return executor;
    }

    // if it is a metadata request to an optional package ...
    return async () => {
      const dummyPkgs = ranges => Object.fromEntries(
        ranges.map(range =>
          // let us use the minimum version that satisfies the specified range(s)!
          ([minVersion(range), { 
            name: pkg, dist: dummyPkgDist
          }])));

      try {
        // ... we first need to check if the package is found in general, before we can proceed
        const result = await executor();

        // if the package exists, we now need to check if all ranges are satisfied by at least one version
        const body = JSON.parse(result.body.toString()), versions = Object.keys(body.versions);

        // if we do not find any unsatisfied ranges, we can return the result
        const unsatisfied = ranges.filter(range => !minSatisfying(versions, range));
        if (!unsatisfied.length) {
          return result;
        }

        // otherwise we will have to add some dummy versions for all ranges that are unsatisfied
        Object.assign(body.versions, dummyPkgs(unsatisfied));

        // we only need a body here! this is the only thing Yarn will care about (and call a toString on)
        return { body: JSON.stringify(body) };
      } catch(e) {
        // if the package was not found, return a dummy metadata object
        if (e.name !== `HTTPError` || e.response.statusCode !== 404) {
          throw e;
        }

        // the package was not found at all, so we need to provide dummy versions for all ranges
        const versions = dummyPkgs(ranges);
        return {
          body: JSON.stringify({
            name: pkg,
            [`dist-tags`]: {
              latest: `${rsort(Object.keys(versions))[0]}`
            },
            versions
          })
        };
      }
    }
  }
};

export default hooks;
