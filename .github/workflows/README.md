# Claude workflows — maintenance notes

The workflow YAML is kept comment-free by request. The decisions below are the
ones that are non-obvious and silently breakable, so they live here instead.
If you change any of these, re-read the reasoning first.

| File | Purpose |
|---|---|
| `claude-code-review.yml` | Automatic review on every PR to `main` |
| `claude.yml` | Answers `@claude` mentions in comments |
| `../claude-review-prompt.md` | The review instructions (edit this to change review behaviour) |
| `../../CLAUDE.md` | Repo conventions, shared by both workflows and local Claude Code |
| `../../.gemini/styleguide.md` | The 13 documentation rules. **Frozen** — do not edit |

## claude-code-review.yml

**`EXCLUDE` must not get a blanket `\.md$`.** It once did, which silently
dropped `README.md` and `Contributing.md` from every review. Only `CHANGELOG.md`
and `LICENSE.md` are excluded by name. `CHANGELOG.md` is *hand-maintained* — no
workflow writes it — so it is excluded by choice, not because a tool owns it.
Keep `EXCLUDE` in sync with `paths-ignore`.

**`typedoc-theme/**` is not generated.** Only `assets/fonts` and `assets/images`
are. The `.hbs` templates and `assets/js/main.js` are hand-written and render the
public docs site, so they are in scope — unescaped `{{{ }}}` there is an XSS path.

**Both `GITHUB_OUTPUT` heredocs use a random delimiter, and `count` is written
last.** File paths come from the PR author. With a fixed delimiter, a PR adding
files named `REVIEW_FILES_EOF` and `count=0` breaks out of the heredoc and
overwrites `count`, flipping the `count != '0'` guard so the PR suppresses its
own review. Reproduced before the fix. Do not "simplify" either property.

**The prompt is read with `git show "$BASE_SHA:..."`, not `cat`.** `cat` reads
the PR's checkout, which would let a PR rewrite the rules it is about to be
reviewed against, at the top of the prompt. The `elif [ -f ... ]` branch is a
bootstrap for the one PR that first adds the file; after merge `git show` always
wins.

**The changed-file list comes from local git, not `gh pr diff`.** `gh pr diff`
uses the GraphQL API, which 502'd and failed whole runs. `fetch-depth: 0` puts
both commits on disk, so the merge-base three-dot diff needs no API and no token.
It must stay three-dot (`git merge-base` then diff) — a two-dot diff wrongly
includes commits that landed on `main` after the branch forked.

**No `id-token: write`.** It is needed only for `anthropic_federation_rule_id`
workload-identity auth, which this repo does not use — both credentials are
passed explicitly. Verified on run 32049364118: no OIDC exchange occurred.

**`--max-turns` is a real constraint.** A run at 25 died with
`error_max_turns`, posting nothing. The reference run used 44 turns / ~7 min /
$1.46 on sonnet while posting *zero* inline comments, so a PR that spends the
18-comment budget needs well above 60. Raise `CLAUDE_REVIEW_MAX_TURNS` rather
than editing the file.

**`use_sticky_comment` only governs the action's own tracking comment.** The
review summary is posted by Claude via `gh pr comment`, which is why the prompt
requires `--edit-last --create-if-none`; plain `gh pr comment` would leave one
summary per push.

## claude.yml

**`--allowedTools` is an allowlist and the omissions are the point:** no bare
`Bash`, no `Edit`/`Write`, no `WebFetch`. `contents: read` blocks `git push` and
nothing else — it does not stop authenticated `gh` writes against the
`issues: write` token, or curl exfiltrating `ANTHROPIC_API_KEY`. The threat is
indirect prompt injection: an outside contributor plants a payload in a PR, a
trusted collaborator types `@claude explain this diff`, and Claude reads the
payload while doing its job. The prompt says "you cannot push"; the allowlist is
what enforces it.

**The checkout needs an explicit `ref:`.** None of this workflow's three
triggers point `github.ref` at the PR — only the `pull_request` event does that.
Without a ref, `issue_comment` (the common `@claude` path) checks out the default
branch, so `Read`/`Grep` and the local `git` tools would describe `main` while
the API-backed `gh pr view`/`gh pr diff` describe the real PR — contradictory
answers, with the local ones wrong. The `Resolve PR ref` step builds
`refs/pull/<n>/head`, which works for same-repo and fork PRs and needs no API
call. It resolves to empty for a comment on a plain issue, which correctly falls
back to the default branch.

**The `if:` gate checks author association.** This is a public repo, so
`issue_comment` fires for any GitHub user. Without the gate, anyone could spend
`ANTHROPIC_API_KEY` by commenting.

**Do not put review-only instructions in `CLAUDE.md`.** It is auto-loaded by
both workflows; "you are review-only, never commit" would break this one.

## Shared

**Configuration is repository variables, not file edits:** `CLAUDE_MODEL`
(both workflows), `CLAUDE_REVIEW_MAX_TURNS`, `CLAUDE_ONDEMAND_MAX_TURNS`.

```
gh variable set CLAUDE_MODEL --body claude-opus-5
gh variable delete CLAUDE_MODEL
```

**`claude_args` is a literal block** — every line is passed to the CLI verbatim,
so a `#` comment inside it becomes an argument and breaks the run.

**Fork PRs are not reviewed** (`head.repo.full_name == github.repository`).
`pull_request` does not expose secrets to forks, so the job would fail on every
external contribution. Fixing this needs `pull_request_target`, which is
dangerous on a public repo — deliberate gap, not an oversight.
