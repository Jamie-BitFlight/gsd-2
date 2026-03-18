const ROOT = new URL("../../../../../", import.meta.url);
// Main repo packages (worktrees share the same packages)
const MAIN_REPO = new URL("file:///home/ubuntulinuxqa2/repos/gsd-2/");

export function resolve(specifier, context, nextResolve) {
  // 1. Direct redirects to dist/ for specific packages
  // Use main repo's built packages since worktrees don't have separate builds
  if (specifier === "../../packages/pi-coding-agent/src/index.js") {
    specifier = new URL("packages/pi-coding-agent/dist/index.js", MAIN_REPO).href;
  } else if (specifier === "@gsd/pi-ai/oauth") {
    specifier = new URL("packages/pi-ai/dist/utils/oauth/index.js", MAIN_REPO).href;
  } else if (specifier === "@gsd/pi-ai") {
    specifier = new URL("packages/pi-ai/dist/index.js", MAIN_REPO).href;
  } else if (specifier === "@gsd/pi-agent-core") {
    specifier = new URL("packages/pi-agent-core/dist/index.js", MAIN_REPO).href;
  }
  // 2. Mapping .js to .ts for local imports when running tests from src/
  else if (specifier.endsWith('.js') && (specifier.startsWith('./') || specifier.startsWith('../'))) {
    if (context.parentURL && context.parentURL.includes('/src/')) {
      if (specifier.includes('/dist/')) {
        specifier = specifier.replace('/dist/', '/src/').replace(/\.js$/, '.ts');
      } else {
        specifier = specifier.replace(/\.js$/, '.ts');
      }
    }
  }

  return nextResolve(specifier, context);
}
