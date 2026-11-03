# Δ Delta

**Bridging the gap between versions.** We make systems faster and cleaner. Details matter.

`delta` is a tiny command-line tool that turns the difference between two versions into a clean, precise summary. Instead of scrolling through raw diffs, you get the delta at a glance: what changed, how much, and where.

## Install

```bash
npm install -g .
```

Or run it directly:

```bash
node cli.js <ref1> <ref2>
```

## Usage

Compare two git refs (tags, branches, or commits):

```bash
delta v1.0.0 v1.1.0
delta main feature/cleanup
```

Compare two files:

```bash
delta src/old.js src/new.js
```

## Example output

```
Δ delta — precise changes between versions

  from:  v1.0.0
  to:    v1.1.0

  files        4
  insertions  +128
  deletions   -42

  Δ src/core.js   +45  -12
  Δ src/ui.js     +61   -8
  Δ README.md     +22  -22
  Δ package.json   +0   -0
```

## The idea

A **delta** (Δ) is the difference between versions — a precise, point-by-point change. It is the symbol of precision and update. Every release is a delta: small, exact, and measurable.

## License

MIT
