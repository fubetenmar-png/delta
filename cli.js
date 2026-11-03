#!/usr/bin/env node
import { execFileSync } from "node:child_process";

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";

const TRIANGLE = "\u0394"; // Δ

function help() {
  console.log(`
${CYAN}${BOLD}${TRIANGLE} delta${RESET} — precise changes between versions

${DIM}Bridging the gap between versions. Details matter.${RESET}

Usage:
  delta <ref1> <ref2>          summarize changes between two git refs
  delta <file1> <file2>        summarize changes between two files

Examples:
  delta v1.0.0 v1.1.0
  delta main feature/cleanup
  delta src/old.js src/new.js
`);
}

function git(args, opts = {}) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      ...opts,
    }).trimEnd();
  } catch {
    return null;
  }
}

function isGitRepo() {
  return git(["rev-parse", "--is-inside-work-tree"]) === "true";
}

function summarizeTwoFiles(a, b) {
  // git diff --no-index exits with code 1 when files differ; execFileSync throws,
  // so we read stdout manually via a tolerant call.
  const raw = diffNoIndexNumstat(a, b);
  if (raw === null) {
    console.error(`${RED}error:${RESET} could not read one or both files.`);
    process.exit(1);
  }
  const lines = raw.split("\n").filter(Boolean);
  return summarizeLines(lines, a, b);
}

function diffNoIndexNumstat(a, b) {
  try {
    // --no-index returns exit 1 on differences, so capture stderr separately.
    return execFileSync("git", ["diff", "--no-index", "--numstat", "--", a, b], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch (e) {
    // e.stdout holds the diff even though the process exited non-zero.
    if (e && typeof e.stdout === "string" && e.stdout.length) return e.stdout;
    return null;
  }
}

function summarizeLines(numstatLines, a, b) {
  const files = [];
  let add = 0;
  let del = 0;

  for (const line of numstatLines) {
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    const [added, removed, path] = parts;
    const isBinary = added === "-" || removed === "-";
    const aNum = isBinary ? 0 : Number(added);
    const dNum = isBinary ? 0 : Number(removed);
    add += aNum;
    del += dNum;
    files.push({ path, added: aNum, removed: dNum, binary: isBinary });
  }

  if (files.length === 0) {
    console.log(`${GREEN}${TRIANGLE}${RESET} No differences — the two versions are identical.`);
    return;
  }

  console.log(`\n${CYAN}${BOLD}${TRIANGLE} delta${RESET} — precise changes between versions\n`);
  console.log(`  ${DIM}from:${RESET}  ${a}`);
  console.log(`  ${DIM}to:${RESET}    ${b}\n`);

  const rows = [
    ["files", String(files.length)],
    ["insertions", `${GREEN}+${add}${RESET}`],
    ["deletions", `${RED}-${del}${RESET}`],
  ];

  const width = Math.max(...rows.map(([k]) => k.length));
  for (const [k, v] of rows) {
    console.log(`  ${DIM}${k.padEnd(width)}${RESET}  ${v}`);
  }

  console.log(`\n  ${DIM}file breakdown${RESET}\n`);
  const maxPath = Math.max(...files.map((f) => f.path.length));
  for (const f of files) {
    const path = f.binary ? `${f.path} ${DIM}(binary)${RESET}` : f.path;
    const plus = f.binary ? " " : `${GREEN}+${String(f.added).padStart(4)}${RESET}`;
    const minus = f.binary ? " " : `${RED}-${String(f.removed).padStart(4)}${RESET}`;
    console.log(`  ${YELLOW}${TRIANGLE}${RESET} ${path.padEnd(maxPath + 1)} ${plus} ${minus}`);
  }

  console.log(`\n  ${DIM}Details matter.${RESET}\n`);
}

function summarizeTwoRefs(a, b) {
  const numstat = git(["diff", "--numstat", `${a}`, `${b}`]);
  if (numstat === null) {
    console.error(`${RED}error:${RESET} unable to diff refs. Are both refs valid?`);
    process.exit(1);
  }
  if (!numstat.length) {
    console.log(`${GREEN}${TRIANGLE}${RESET} No differences between ${a} and ${b}.`);
    return;
  }
  summarizeLines(numstat.split("\n"), a, b);
}

function main() {
  const args = process.argv.slice(2);

  if (args.includes("-h") || args.includes("--help") || args.length === 0) {
    help();
    return;
  }

  if (args.length !== 2) {
    help();
    process.exit(1);
  }

  const [a, b] = args;

  if (isGitRepo() && !a.includes("/") && !b.includes("/") && !a.includes(".") && !b.includes(".")) {
    // Looks like two refs (tags/branches/commits), not files.
    summarizeTwoRefs(a, b);
  } else if (a.includes("/") || b.includes("/")) {
    // At least one argument looks like a filesystem path.
    summarizeTwoFiles(a, b);
  } else {
    // Fall back to ref comparison when we are inside a repo; otherwise files.
    summarizeTwoRefs(a, b);
  }
}

main();
