# Dashboard sync — automatic, no manual step

The TON HQ dashboard (Command Center) at http://localhost:7777 **auto-syncs git
commits by itself**. The local server (`pm-server.mjs`) watches every tracked
repo's `.git/HEAD` and refreshes each project's latest commit — on every commit
and on every page load, pushing a live update to the open dashboard.

**There is NO manual step.** Do **not** write `pm-sync.json`, do **not** run
`npm run sync`, and do **not** tell the user to "Import → pm-sync.json". That old
flow is retired.

## What makes a project sync
Its **`repo`** field in the dashboard must match the repo's GitHub remote
(`owner/name`). `~/TON/scripts/new-project.sh` and `app/pm-add.mjs` set this
automatically. If a project's commits aren't showing, its `repo` link is wrong or
missing — **fix the link** (in `~/MyProjects/Dashboard/pm-data.json` or the
dashboard's project Edit), don't import a file. A repo with **no GitHub remote**
can't show commit history; add a remote if live commits are wanted.

## Rule for Claude Code (in any repo)
- **Commits** → nothing to do; they appear on the dashboard automatically.
- **Status / phase / deadline / payment changes** → the Boss updates the dashboard
  directly by editing `~/MyProjects/Dashboard/pm-data.json` (or via the dashboard
  UI). Never route these through a sync file or ask the user to import anything.
- Never change existing `id`s in `pm-data.json`; edits are surgical and additive.
