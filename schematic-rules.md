<!-- GENERATED COPY — do not edit.
     Canonical: ~/TON/hq/schematic-rules.md
     Update there, then re-run scripts/sync-project-memos.sh. -->

# TON by Swiss — Engineering Rules (canonical)

**Every agent is bound by this file.** Part A is Ali's rules. Part B is the
firm's engineering rules. Part C is how a new rule gets added. Nothing here is
optional and nothing here is a matter of taste.

```
python3 scripts/kicad/check_ali_rules.py <sheet>.kicad_sch [...]     # house rules
~/TON/scripts/kicad-cli sch erc --exit-code-violations <root>.kicad_sch   # ERC
```

**Run both before asking any human or any agent for a review.** A schematic with
ERRORs does not go to Greta and does not go to Ali. This is not a review round —
it is a 0.2-second script, and it costs nothing.

| Severity | Meaning |
|---|---|
| `ERROR` | BLOCKER. Fix before the sheet leaves the designer's hands. |
| `WARN` | Punch-list item. Carried to the next revision; does not block. |

| Tag | Meaning |
|---|---|
| *checked* | `check_ali_rules.py` enforces it. Never spend a model on it. |
| *CLI* | KiCad's own tooling enforces it. Also free. |
| *human* | Needs judgement. **This is what a review round is for.** |

---

# Part A — Ali's rules (1–15)

*Ali's own rules, as he wrote them. These are never renumbered and never
rewritten without him.*

## 1. Small symbols for all passives — *checked*

Resistors, capacitors (polarized or not), coils, diodes and LEDs use the
**small** symbol variant: `R_Small`, `C_Small`, `CP_Small`, `L_Small`,
`D_Small`, `LED_Small`. Never the full-size `Device:R` / `Device:C`.

## 2. Package must match the electrical job — *partly checked*

The agent picks package size and shape from the part's real power and voltage
needs (datasheet, or the vendor's recommendation) — not from habit. The **value
field must state the rating the package was chosen for**:

- Resistors: `6K8/0.25W`
- Capacitors: `100u-16V`

*Checked:* a footprint is assigned, and the value carries a W or V rating.
*Human:* whether that rating is the electrically correct one.

## 3. Resistor footprints live in `PCM_Resistor_SMD_AKL` — *checked*

Example: `PCM_Resistor_SMD_AKL:R_0805_2012Metric_Pad1.20x1.40mm_HandSolder`.
**Not** `Resistor_SMD`.

## 4. Capacitor footprints live in `Capacitor_SMD` — *checked*

Example: `Capacitor_SMD:C_0805_2012Metric_Pad1.18x1.45mm_HandSolder`.
Different library from resistors, always.

## 5. Every part carries an `LCSC` row — *checked*

An `LCSC` row in **Symbol Properties** holding the real part code, e.g.
`C98220`. Store the bare code, not a URL.

## 6. No LCSC part → the row stays empty — *checked*

The row must **exist**. Empty is a valid answer; missing is not. Empty says
"checked, not available"; missing says nothing at all.

## 7. The schematic must be readable by a human — ***human***

The rule that matters most, and the only one no script can decide. Ali must be
able to open the sheet and follow the circuit without getting lost. Signal flows
left to right, power top to bottom; functional blocks grouped and boxed; related
parts together. **Ali's own finished designs are the reference** — not an
AI-generated arrangement that is technically correct and unreadable.

**This is what Greta's review round is for.**

## 8. Power flags connect to the rail — *checked*

A `PWR_FLAG` must be attached to the wire it flags, not floating beside it.

## 9. No overlapping or crowded symbols — *checked*

Symbol bodies keep at least **1.27 mm** clear. Stacked parts are a blocker.

## 10. A GND net needs a GND symbol — *checked*

Place the ground symbol. A net **label** reading "GND" is not a ground symbol.

## 11. Net labels sit on a stub — *checked (WARN)*

Roughly **10 mm** of wire off the pin before the label, so the net reads cleanly
instead of being jammed against the part body.

## 12. Every sheet title describes that sheet — *checked*

If you copy a sheet as a template, **rename every title**.

> Real defect: `MQ7_Sens.kicad_sch` still carried "INPUT & OUTPUT" and
> "Current sens." copied from the SMK sheet (fixed 2026-09-15). The checker now
> flags two sheets sharing a title automatically.

## 13. Notes boxes carry real content — *checked*

**What is carried over unchanged from the old design and what is new this
revision, with the source and the date.** Never `0000`, `TBD`, or `XXX`.


## 14. A one-block sheet uses A5 paper — *checked (WARN)*

*Ali, confirmed 2026-09-20, after he resized Buzzer / PushButtons / TFT_Display /
USB_C to A5 himself.*

A small sheet that only has one functional block on it should use **A5** paper,
not A4. A sheet with more than one block, or a lot of connectors, stays whatever
size actually fits it.

*Checked:* a sheet on A4 or larger holding few enough symbols to be a single
block is reported as a WARN. *Human:* whether it really is one block.

## 15. Reused power symbols are deliberate — *checked (ERROR)*

*Ali, 2026-09-20.*

It is fine to reuse the same few power symbols (a generic `+12C` or `VAA` arrow,
a generic ground symbol) for different rails and just change the **Value** text
to the real rail name — `+24V`, `+VSEN`, `GND`, `AGND`. Ali does this on
purpose. **Do not treat it as a mistake and do not "fix" it.**

The only real problem is two symbols on the **same sheet** showing the same
Value text while actually sitting on **different nets**. That one needs fixing —
check the real wiring, not the symbol name.

---

# Part B — Firm engineering rules (16–27)

*Added by the Boss 2026-09-21 as 14–25; renumbered to 16–27 the same
day when Ali's own rules 14 and 15 arrived — Part A keeps his numbering, so
Part B moved. Part B numbers are fixed from here on.*

*Every one of these comes from a defect that
actually happened on a TON board and is recorded in the work log — none is
invented. Same force as Part A.*

## 16. The Value field is BOM data, not prose — *checked (WARN)*

`Value` holds the part spec only: `100k 1% 0.1W`. Explanations, justifications
and history go in a note or a custom field — never inside `Value`. A Value field
is what lands in the BOM and on the purchase order.

> Real defect: ECU_TESTER `R407` reads
> `100k 1% (EN pull-up, belt-and-suspenders over the part's internal pull-up)`.
> 88 parts on that board carry prose in `Value`.

## 17. Unit prefixes must be sane — the 1000x rule — *checked (ERROR)*

Write a value in its natural unit. `100n`, never `100000p`. Any capacitance or
inductance whose number is ≥ 1000 with a prefix attached is reported as a prefix
slip and must be rewritten.

> Real defect: DSH-SMPS-4W05 carried `C1 = 100000 nF` meaning 100 nF and
> `C3 = 10000 nF` meaning 10 nF — genuine 1000x errors found 2026-09-15, after
> the values had already been reviewed.

## 18. Designators unique and fully annotated — *checked (ERROR)*

No `R?` left anywhere, and no designator placed twice on one board. Multi-unit
parts sharing a reference across different units are legal and are not flagged.
**Run the checker on one board at a time** — a separate adapter board is a
separate project.

## 19. ERC passes clean before handoff — *CLI*

```
~/TON/scripts/kicad-cli sch erc --severity-error --exit-code-violations <root>.kicad_sch
```
Exit code 0 = clean, 5 = violations. A non-zero exit is a BLOCKER. If a
violation is genuinely acceptable, it is **excluded in the project with a
written reason** — never ignored silently.

The same principle covers the house rules: only Ali can waive one, per board,
in `house-rules-waivers.yaml` beside the schematic — the rule, the exact refs
(no wildcards), the reason, `ruled_by` and `date`. `check_ali_rules.py` then
prints those findings as `WAIVED` instead of `ERROR`, refuses a waiver missing
any field, and flags a waiver that no longer matches anything.

## 20. Schematic ↔ PCB parity before any layout review — *CLI*

```
~/TON/scripts/kicad-cli pcb drc --schematic-parity --exit-code-violations <board>.kicad_pcb
```
Layout is not reviewed by anyone until the board matches the schematic. Review
time spent on a board that disagrees with its own schematic is wasted money.

## 21. Every number is derived, never asserted — ***human***

Any electrical claim shows its arithmetic inline: inputs → formula → result,
with the datasheet section cited. "The trip point is 5.75–6.25 V" is not a
number; the divider that produces it is.

> Real defect: DSH-SMPS-4W05's OVP crowbar trip window was asserted rather than
> derived; the actual divider gave 5.91 V nominal, 5.82–6.01 V with tolerances.

## 22. Derating is stated, not assumed — ***human*** *(partly checked via rule 2)*

Every power-handling part carries its derating in the notes: passives at ≤ 50%
of rated voltage and power, electrolytics ≤ 80% of rated voltage, and any
switch, SCR or MOSFET rated for **surge** current, not just steady state.

> Real defect: the DSH-SMPS-4W05 crowbar SCR was **3.2x under-rated on current**
> (2.56 A rms for 50 ms × 3000 cycles) while being 12x over-rated on voltage.

## 23. One value, one home — ***process***

A number lives in exactly one place. Everything else **cites** it; nothing
restates it. If a value appears in a document and in the schematic, the
schematic wins and the document points at it.

> Real defect: a single efficiency figure existed as both 75.7% and 77.94%
> across the DSH-SMPS-4W05 pack, and the firm then spent 66 tasks building
> "stale value matchers" to police the copies instead of deleting them.

## 24. Decoupling is per datasheet and traceable — ***human***

Every IC power pin gets its decoupling as the datasheet specifies, and the note
cites the datasheet section. A generic 100n "because that's normal" is not a
design decision.

## 25. Test points on every rail and every probe target — ***human***

Every power rail gets a test point, plus every signal Ali will need to probe to
bring the board up. A board that cannot be debugged on the bench is not finished.

## 26. One sheet, one function — *checked (WARN)*

A sheet holds one functional block, and no more than **40 symbols**. A sheet
past that limit gets split.

> Real defect: ECU_TESTER's `activity_status_cmp.kicad_sch` holds **275
> symbols** on a single sheet. This is rule 7 (readability) made measurable.

## 27. Revisions must diff cleanly — ***process***

UUIDs are preserved across edits, and there is no mass re-annotation. A revision
whose diff touches every line hides its real change, and no reviewer can check
it. Edit the schematic; do not regenerate it.

---

# Part C — How a new rule is added

Rules are added by evidence, not by opinion. The process is deliberately short.

1. **A defect happens** and is recorded in `hq/work-log.jsonl`.
2. **Ask: is it a class or a one-off?** A one-off stays in that project's review
   report. Only a *recurring class* becomes a rule.
3. **Ask: can a script decide it?**
   - **Yes** → it is implemented in `scripts/kicad/check_ali_rules.py` **first**,
     with a fixture in `scripts/kicad/references/`, and only then written here.
     A rule with no check is a wish.
   - **No** → it is tagged ***human*** and belongs to the review round.
4. **It is numbered next in Part B.** Part B numbers are fixed; only an
   arriving Ali rule has ever shifted them (14–25 → 16–27, 2026-09-21), and
   that shift happens in Part A's favour, never the reverse.
5. **Every agent is re-briefed** by running:
   ```
   python3 scripts/check-agent-briefing.py --fix
   ```
   This is mandatory. A rule that an agent has not been told about does not
   exist. The script fails if any agent spec is missing the briefing block.

**Ali's rules always go in Part A**, keeping his numbering, and only he changes
them. Anyone may propose a Part B rule; the Boss accepts it only with a logged
defect behind it.

## Rules under consideration (not yet binding)

Nothing may be enforced from this list until it is promoted into Part B.

- **Thermal budget per board** — a stated junction-temperature margin for every
  part dissipating >100 mW. *(Blocked on: the W29 buck review's open finding —
  unquantified Tj margin — which is the defect that would justify it.)*
- **Impedance stackup confirmed in writing by the fab** before any controlled-
  impedance board is released. *(Currently a note in
  `hq/manufacturer-capabilities.md`; becomes a rule the first time a board ships
  with an unconfirmed stackup.)*
- **Connector pinout sanity** — mating-side pin 1 orientation checked against
  the mechanical drawing. *(Waiting on a real defect.)*

---

## Why this file replaces review rounds

Before: each rule was found by a human-language review, reported as a finding,
fixed, and re-reviewed — one round each, at Opus prices. ECU_TESTER reached
**round 25** this way.

Now: the script enforces 18 of these 27 rules and `kicad-cli` two more — 20 for
free, every time, before review. Greta is spent only on the ***human*** rules —
7, 21, 22, 24, 25 — and on the electrical design itself.

Measured on the real ECU_TESTER hierarchy after 25 review rounds: **831 blocking
violations in 0.22 seconds**, including 401 parts with no LCSC row.
