# HANDOFF — the only channel between Worker A and Worker B

Append below. Never rewrite another worker's entry. Timestamp each block.

---

## Git protocol — read before your first commit

**One working tree, one branch (`revamp`), two sessions.** No worktrees, no second branch:
B must be able to read the primitives A publishes in `base.css`, and this file only works
as a channel if exactly one copy of it exists.

Because you share a tree, every tree-wide git command is destructive to the other session:

- Stage **explicit paths only**. Never `git add -A`, never `git commit -a`.
- Never `git stash`, `git checkout -- .`, `git reset --hard`, or `git clean`.
- Uncommitted changes in files you don't own are the other worker mid-task. Leave them.
- No pull, push, or merge without asking the human.

---

## Ownership map

| Path | Owner |
|---|---|
| `DESIGN.md` | A |
| `public/assets/fonts/**` | A |
| `public/base.css` | A |
| `public/index.html` | A |
| `public/styles.css` | A |
| `public/app.js` | A |
| `public/methodology.html` | B |
| `public/methodology.css` | B |
| `public/print.css` | B |
| `.claude/revamp/PUNCHLIST.md` | B |
| `public/model.js`, `test/**` | frozen — neither |

Need a change outside your column? File it on `PUNCHLIST.md`. Do not edit it yourself.

**A publishes, B consumes:** the ink tokens, the halftone screen, and the overprint
primitive all live in `base.css` and are named in A's `PHASE 0 DONE` block. B builds section
devices out of them and never defines a parallel set.

---

## Status board

- [ ] **A — Phase 0** · typographic route chosen, **fluoro chosen, halftone + overprint primitives built**, fonts installed, `DESIGN.md` rewritten, `base.css` rebuilt → **unblocks B's Tasks 2 and 2b**
- [ ] **B — Task 1** · methodology paper structure (runs in parallel with A Phase 0, no gate)
- [ ] **A — Phase 1** · calculator rebuilt: architecture, control margin, plates, signature moment, **masthead plate**, reveal, responsive
- [ ] **B — Task 2** · methodology page set on A's primitives
- [ ] **B — Task 2b** · section devices + colophon device
- [ ] **B — Task 3** · `print.css`
- [ ] **B — Task 4** · adversarial audit → `PUNCHLIST.md`
- [ ] **A — Phase 2** · punchlist cleared, cross-page consistency, Studio Test, `DESIGN.md` reconciled

---

## Log

<!-- A: append your PHASE 0 DONE block here. B: do not write CSS until it exists. -->
