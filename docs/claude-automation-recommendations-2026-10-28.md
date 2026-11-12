# Claude Code automation recommendations: Ball IQ repo (28 Oct 2026)

Requested by SHQ Social HQ on Alex's behalf. **Status 28 Oct: Alex said yes to all ten ("go ahead, everything you think will benefit us"). All ten are built and tested (`node .claude/hooks/hooks.test.mjs`, 57 cases).** New gates refuse rather than ask, so Alex isn't pinged: the agent fixes its own command. Prefix a command with `BALLIQ_OVERRIDE=1` to turn a refusal into a question for Alex when the exception is real.

Where each one lives: items 1, 2, 3, 6 and 7 are in `.claude/hooks/bash-gates.mjs` (plus `scripts/build-stamp.mjs`, and the `.p8` Read/Edit/Write deny in settings.json). Item 4 is `.claude/hooks/supabase-guard.mjs`. Item 5 is `~/ball-iq-release/store/asc-store.mjs`, outside the repo; there's a backup alongside it. Item 8 is `session-start.mjs`, with `store-state.mjs` and `stamp-gsc.mjs`. Item 9 is `.claude/hooks/stop-visual-proof.mjs` (it blocks the stop once). Item 10 is `.claude/skills/ball-iq-store-release/`.

Brief: rank by how well each item **enforces** a rule mechanically, because forgotten rules are the main problem. Skip anything we already have. Don't touch Claude-Mem.

## What already exists (not re-recommended)

- **Hooks.** session-start (git, deploy and CI state), guard-critical-files (.env deny, questions.js and the Footle answer log ask), bash-gates (piped exit codes, releases from a dirty tree or off main, simulators older than the iOS SDK), postiz-guard, review-guard, postlog-metricool, factlint-on-write, sweep-inbox, stop-deploy-verified (the turn can't end on an unverified deploy), and the agent-brief guard.
- **Build gates in `npm run build`.** Lint, unit tests, the leak, duplicate and giveaway audits, the no-question-count audit, the orphan-page audit and the Home JS budget.
- **Agents.** banger-critic, bank-verifier, social-fact-checker, social-growth-critic, funnel-analyst and webkit-verifier.
- **Skills.** native-build, orientation, question-bank, seo-wave, social, supabase-migration and shq-draft.
- **MCP.** context7 (in .mcp.json), plus the Supabase, Vercel, Sentry, Search Console and Clarity connectors.

**Verdict:** there are no gaps in MCP servers or plugins (the social session is cutting plugins anyway). Every gap is a rule that lives only in CLAUDE.md or memory, with no gate behind it.

## Ranked list

### 1. Push gate: no push to main without a green build of this exact commit (hook)
- **Rule:** CLAUDE.md says to run `npm run build` before pushing. A build that fails the Home JS budget leaves production silently on the previous deploy. Today nothing checks this; it relies on memory.
- **How:**
  - The last step of `npm run build` writes `.build-ok`, containing the HEAD sha.
  - A new bash-gates rule fires on `git push … main`. If `.build-ok` is missing or holds a different sha, it **asks**.
  - The marker is gitignored.
- **Cost:** about 30 lines plus a test case in hooks.test.mjs.

### 2. Git hygiene on main: `git add -A`, `git add .`, `git commit -a` and `--amend` (hook)
- **Rule:** CLAUDE.md says never `git add -A`, because the social session writes under social/ in the same checkout. It also says never `--amend`, because other sessions commit to main too.
- **Gap:** the allow list contains `Bash(git add *)`, so nothing stops either.
- **How:** add both to bash-gates as an **ask** while on main. Explicit pathspecs pass untouched.
- **Cost:** about 15 lines.

### 3. App Store key protection (hook plus a permission deny)
- **Rule:** never read or print the `.p8` keys in `~/.appstoreconnect/private_keys/`. They may only be passed as paths to xcodebuild and the asc scripts.
- **Gap:** nothing enforces it today.
- **How:**
  - Add `Read(~/.appstoreconnect/**)` to permissions **deny**.
  - Add a bash-gates rule: **deny** cat, head, tail, less, base64, openssl, cp and similar on that folder, while still allowing `-authenticationKeyPath …`.
- **Cost:** small. The payoff is that a leaked key is a rotate-and-re-sign day.

### 4. Supabase migration gate (hook on the Supabase MCP tools)
- **Rule:** the skill says the REVOKE rule was "taught more than once". Every CREATE FUNCTION ends with `revoke … from public`, and every CREATE TABLE gets explicit revokes, because the defaults silently grant anon access.
- **How:**
  - A PreToolUse hook on `apply_migration` and `execute_sql`.
  - If the SQL creates a function or table and has no matching `revoke`, it **asks**, quoting the rule.
  - DDL sent through `execute_sql` gets a note to use `apply_migration`.
- **Cost:** about 40 lines. Supabase work is rare, but a single miss quietly exposes data.

### 5. Store-text and submit checks inside `~/ball-iq-release/store/asc-store.mjs` (script gate, not a hook)
- **Rules:**
  - No question count in store text. The build audit only scans the website, not the What's New files.
  - releaseType must be AFTER_APPROVAL on every submission.
  - Tiki Taka Toe stays out of the stores until Alex has tested it.
- **How:**
  - `whatsnew` and `field` refuse text containing a number followed by "questions".
  - `submit` refuses unless releaseType is AFTER_APPROVAL.
  - `submit` warns if the attached build's bundle contains the Tiki Taka Toe route while a `TTT_APPROVED` flag file is absent.
- **Why here:** the script is the only door to submission, so this is stronger than a hook.

### 6. One simulator at a time, and tell Tide HQ (extend the existing simulator rule in bash-gates)
- **Rule:** tell the Tide HQ session before booting, and never run two simulators at once.
- **Gap:** bash-gates already reads `simctl list` for the SDK check, but not for this.
- **How:** on `simctl boot`, if another device is already Booted, **ask**. The message reminds the agent to message Tide HQ first.
- **Cost:** about 10 lines, reusing the code already there.

### 7. Service worker version check on commit (hook)
- **Rule:** CLAUDE.md says to bump CACHE_VERSION in the same commit as any change to `public/sw.js` logic.
- **How:** on `git commit`, if `public/sw.js` is staged with changes beyond the CACHE_VERSION line and that line didn't change, **ask**.
- **Cost:** about 20 lines. It fires rarely, but a miss strands installed PWAs on old caches.

### 8. Store state in the session-start banner (hook extension)
- **Rule:** "Prod status is unknowable from the repo", and sessions have claimed wrong release states before.
- **How:** session-start adds one line, for example "App Store: 1.8.5 WAITING_FOR_REVIEW · newest TestFlight 167 (1.8.6)".
  - It is read with `scripts/asc.mjs` under a 4-second timeout and fails quietly.
  - It also adds "Search Console last read: <date>" from a small stamp file, which makes the read-GSC-daily rule visible.
- **Cost:** about 30 lines.

### 9. Look-with-my-own-eyes stop check (Stop hook, optional and noisier)
- **Rule:** every visual change gets a real screenshot before shipping.
- **How:** if this turn pushed a commit touching `src/**/*.css|jsx`, `index.html` or the SEO generator, and the transcript shows no screenshot or webkit-verifier call after the last edit, the hook blocks the stop once and asks for proof.
- **Risk:** false alarms on text-only JSX edits. Try it warn-only for a week first.

### 10. Skill: `ball-iq-store-release` (new skill, not a gate)
- **Why:** the App Store recipe lives only in memory notes: create, the 19-locale What's New map from 14 files, attach, AFTER_APPROVAL, submit, and verifying TestFlight group delivery. It gets rebuilt from scratch every release.
- **How:** one skill file with the order of steps, the locale map and the traps. It points at items 5 and 3 above for enforcement.
- **Invocation:** both user and Claude.

## Deliberately not recommended

- **New MCP servers or plugins.** Coverage is complete, and the goal right now is less clutter.
- **A generic code-reviewer agent.** The pr-review-toolkit agents plus webkit-verifier and bank-verifier already cover review.
- **Auto-format or auto-lint on every edit.** ESLint runs inside the build gate, and a per-edit hook would slow every edit to questions.js (2.4 MB).
- **Replacing or adding a memory system.** Claude-Mem is account-wide now.

## Suggested order if Alex says yes to everything
1. Items 1, 2, 3 and 6: one bash-gates change with tests, about an hour.
2. Item 5: the asc-store script.
3. Item 4: the Supabase hook.
4. Items 7 and 8.
5. Item 10: the skill.
6. Item 9 last, warn-only.
