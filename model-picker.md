# Model Picker & Pre-Ship Model Check

Standing rule for every TON by Swiss project — **existing and future**. This file
is imported into every project's `CLAUDE.md`, so it's always in context, in every
repo, without copy-pasting. Its purpose: save tokens, money, and time by matching
the model to the task, and by never shipping something an independent pass hasn't
checked.

> **Note on model names:** this file deliberately says "Haiku / Sonnet / Opus",
> never a version number. Anthropic ships new point releases regularly; a hardcoded
> "Sonnet 4.6" or "Opus 4.7" goes stale the day a new model ships. The `/model`
> command and the CLI's `haiku`/`sonnet`/`opus` aliases (used throughout
> `~/.claude/agents/*.md` and `charter/roster.md`) always resolve to the current
> release of that tier — write the tier, not the version, and this file never
> needs updating again.

This covers **direct work** — when Ali or the Boss is working hands-on in a
project, not delegating to a named department agent. Delegated work already has
its model fixed per role (see `workflows.md` → *Model economy* and
`roster.md`) — Werner/Bruno/Stefan/etc. run on `sonnet`, Luca/Otto on `haiku`,
Greta always on `opus`. Nothing below overrides that.

---

## The quick rule

| Task | Model | Why |
|---|---|---|
| Typo, one-line fix, quick factual question | **Haiku** | Fastest, cheapest — don't spend more than the task is worth |
| Write new code (firmware/driver/multi-file), a design decision (chip/topology choice), most debugging | **Sonnet** | Your default — balanced reasoning, use it ~70% of the time |
| Independent review before it ships (code review, PCB/schematic review, a tricky logic bug, architecture call) | **Opus** | Deepest reasoning — reserve it for the moment a mistake is expensive |

## Each tier in one line

- **Haiku — the sprinter.** Cheapest, fastest, shallow. Good for: tiny fixes, quick
  questions, throwaway explanations. Bad for: writing new firmware, real review.
- **Sonnet — the daily driver.** Good balance of speed and depth. Use it for
  writing code, making design decisions, explaining concepts, most debugging.
  This is the default for direct work.
- **Opus — the insurance.** Slower and more expensive on purpose — it catches
  edge cases Sonnet misses. Spend it deliberately: before a client sees the work,
  before a PCB goes to fab, before a hard bug gets a second guess.

**Money hack:** write with Sonnet first. Only reach for Opus when Sonnet's own
output looks uncertain, or the moment is genuinely "before this ships." Never use
Opus for a fix Haiku could make.

## Before shipping — the Model Check gate

Applies to anything going to a client, to fab, or into a merge — whether it went
through a full department pipeline or was direct hands-on work:

- [ ] Written with **Sonnet** (or the responsible department agent)
- [ ] Reviewed with **Opus** by someone other than the author — for PCB work this
  **is** Greta's mandatory review gate (`workflows.md`); for firmware/software this
  **is** the independent review gate against `hq/firmware-review-checklist.md`.
  For quick direct work with no formal department involved, run `/code-review` or
  switch to Opus yourself for the final pass — don't skip the second pair of eyes
  just because no agent was formally spawned.
- [ ] Production-safety specifics checked where relevant: flash encryption / eFuse,
  NVS wear, mutex/ISR safety, impedance stackup confirmed with the fab
- [ ] One more read of the diff, by a human, before it goes out

**Traffic light:**
🟢 **Ship it** — Sonnet-level work done, Opus-level review passed, nothing flagged.
🟡 **Fix first** — the review flagged something; resolve it, then ship.
🔴 **Stop** — a safety or logic issue was found; this does not merge or ship yet.

This is the same discipline as the firm's review-loop rule (`workflows.md` →
*Review-loop discipline*): a 🟡/🔴 finding is an open item until a later pass
resolves it, never quietly closed.

## Adding this to a project's PUNCHLIST.md

If a project keeps a `PUNCHLIST.md` (see `SC-Board`, `Smart_Bottle_Base` for the
existing convention) and starts a new phase, add a short **Model Check** section
using the checklist above before that phase's items are marked done.
