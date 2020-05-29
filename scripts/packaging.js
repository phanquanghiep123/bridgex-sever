const path = require("path");
const fs = require("fs");

const shell = require("shelljs");
const yargs = require("yargs");
const JSZip = require("jszip");
const YAML = require("yaml");

shell.config.silent = true;

const DONE = `\u{1b}[0;32mdone.\u{1b}[0m`;
const FAILED = `\u{1b}[0;31mFAILED\u{1b}[0m`;

function pack(args) {
  shell.echo(`*** START Packaging ***`);
  const dirname = path.dirname(args.meta);

  shell.echo("");
  shell.echo(`metadata     :  ${path.join(args.meta)}`);
  shell.echo(`output file  :  ${path.join(args.name)}`);
  shell.echo("");

  shell.echo("-n", `Checking files ... `);

  const zipFile = new JSZip();
  try {
    const metayaml = fs.readFileSync(args.meta, "utf8");

    const metadata = YAML.parse(metayaml);
    const files = metadata.files;

    zipFile.file("META.yaml", metayaml);
    files.reduce((p, elm) => {
      p.file(elm, fs.readFileSync(path.join(dirname, elm)));
      return p;
    }, zipFile);
  } catch (err) {
    shell.echo(err.toString());
    shell.echo(FAILED);
    process.exit(1);
  }
  shell.echo(DONE);

  shell.echo("-n", `Packaging ... `);

  zipFile
    .generateNodeStream({ type: "nodebuffer", streamFiles: true })
    .pipe(fs.createWriteStream(path.join(args.name)))
    .on("finish", () => {
      shell.echo(DONE);
      shell.echo("*** Packaging SUCCESS ***");
      process.exit(0);
    })
    .on("error", (err) => {
      shell.echo(err.toString());
      shell.echo(FAILED);
      process.exit(1);
    });
}

yargs
  .command(
    "pack",
    "create package according to META.yaml",
    {
      name: {
        alias: "n",
        description: "the file name of generated package",
        default: "bridgex-package.zip",
      },
      meta: {
        alias: "m",
        description: "the file name of META.yaml",
        default: "META.yaml",
      },
    },
    (args) => pack(args),
  )
  .example(
    "pack",
    `
  node packaging.js pack -n testtest.zip -m ./packaging-test/META.yaml
  `,
  )
  .demandCommand(1)
  .help("h")
  .alias("h", "help").argv;
