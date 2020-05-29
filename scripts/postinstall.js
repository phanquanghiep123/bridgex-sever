const shell = require("shelljs");
const path = require("path");

shell.echo("postinstall: setup git config for this project");

if (shell.which("git").code) {
  shell.echo("Git client is not found. Is this a CI environment?");
  shell.echo();
  shell.echo("\u{1b}[93mIf you will develop this app, we strongly recommend to retry 'npm install' after installing git client.\u{1b}[39m");
  shell.exit();
}

const result = shell.exec(`git config include.path ${path.join(__dirname, "..", ".gitconfig")}`);
if (result.code) {
  shell.echo("Something wrong with setup. Aborting.");
  shell.echo(result.stdout);
  shell.echo(result.stderr);
  shell.exit(result.code);
}

shell.echo("done!");
shell.exit();
