import { structUtils } from '@yarnpkg/core';
import { Hooks as PackHooks } from '@yarnpkg/plugin-pack';
import { isDummyPkg } from './index';

const hooks : PackHooks = {
  // implement a beforeWorkspacePacking to realize (remove) non-existent optional dependencies
  beforeWorkspacePacking: async (workspace, rawManifest) => {
    const { project } = workspace;

    // if there are no optional dependencies, there is nothing we must do
    if (!rawManifest[`optionalDependencies`]) {
      return;
    }

    let updated = false;
    // yarn treats optionalDependencies as normal dependencies, thus we just iterate the dependencies scope
    for (const descriptor of workspace.manifest.getForScope(`dependencies`).values()) {
      const ident = structUtils.stringifyIdent(descriptor);

      await project.restoreInstallState();
      
      const pkg = Array.from(project.storedPackages.values()).find(pkg => pkg.identHash === descriptor.identHash);
      if (pkg && isDummyPkg(decodeURIComponent(pkg.reference))) {
        updated = true;
        delete rawManifest[`optionalDependencies`][ident];
        delete workspace.manifest.raw[`optionalDependencies`][ident];
        workspace.manifest[`dependencies`].delete(descriptor.identHash);
      }
    }

    if (updated) {
      if (!rawManifest[`optionalDependencies`].length) {
        delete rawManifest[`optionalDependencies`];
        delete workspace.manifest.raw[`optionalDependencies`];
      }

      await project.configuration.triggerHook(
        (hooks: PackHooks) => (hooks as any).beforeWorkspacePacking,
        workspace,
        rawManifest
      );
    }
  }
};

export default hooks;
