const path = require('node:path');

/**
 * lint-staged always spawns commands with the repo root as cwd (npm --prefix does NOT change
 * a child process's actual working directory, only npm's own package resolution — learned the
 * hard way). So: invoke each subpackage's own locally-installed eslint/prettier binaries
 * directly, pass root-relative file paths, and point ESLint at the right config explicitly
 * (Prettier auto-discovers the nearest .prettierrc per file, so it needs no such flag).
 */
function forPackage(pkgDir, eslintConfigFile) {
  const toSlash = (p) => p.split(path.sep).join('/');
  const eslintBin = toSlash(path.join(pkgDir, 'node_modules', '.bin', 'eslint'));
  const prettierBin = toSlash(path.join(pkgDir, 'node_modules', '.bin', 'prettier'));

  return (files) => {
    const relFiles = files.map((f) => toSlash(path.relative(process.cwd(), f)));
    return [
      `${eslintBin} --config ${pkgDir}/${eslintConfigFile} --fix ${relFiles.join(' ')}`,
      `${prettierBin} --write ${relFiles.join(' ')}`,
    ];
  };
}

module.exports = {
  'backend/**/*.{ts,js}': forPackage('backend', 'eslint.config.mjs'),
  'frontend/**/*.{ts,tsx,js,jsx}': forPackage('frontend', 'eslint.config.js'),
  '*.{json,md}': ['prettier --write'],
};
