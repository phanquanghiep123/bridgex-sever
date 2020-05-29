const path = require("path");

const isTooManyFiles = (filenames) => filenames.length > 20;
const toRelative = (absPaths) => absPaths.map((file) => path.relative(process.cwd(), file));

module.exports = {
  "*": () => "pretty-quick --staged",
  "{src,test}/**/*.ts": (filenames) => {
    const targets = toRelative(filenames).join(" ");
    console.log(`{src,test}/**/*.{ts,js}: targets are ${filenames.length} files.`);
    const lintCmds = [`eslint --fix ${isTooManyFiles(filenames) ? "" : targets}`];
    const gitCmds = filenames.map((path) => `git add ${path}`);
    return [...lintCmds, ...gitCmds];
  },
  // "package.json": () => "fixpack",
};
