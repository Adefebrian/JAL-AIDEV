---
description: SEO, GEO and AEO in one command, audit a site and score SEO, AEO and GEO 0 to 100 with evidence, integrate the full JAL search layer into a project, boost an existing site's scores and prove the delta, submit URLs to IndexNow, Bing and Yandex, and monitor crawlers, index coverage and search performance. Modes, audit, integrate, boost, submit, monitor.
argument-hint: [audit|integrate|boost|submit|monitor] [url or urls]
---

What to do: $ARGUMENTS

## What this does

It makes a site easy to find on all three kinds of search, and scores each one from 0 to 100:
- **SEO:** found and ranked on Google, Bing, and Yandex.
- **AEO:** the direct answer in snippets, "People also ask", voice assistants, and AI Overviews.
- **GEO:** named and cited by ChatGPT, Claude, Perplexity, Gemini, Copilot, and the other assistants.

| Mode | Use it to |
|---|---|
| `audit [url]` | Score SEO, AEO, and GEO with evidence for every item. Gaps are sorted into what code can fix, what needs facts from the owner, and what only a person can do offsite |
| `integrate` | Install the full search layer into this project, test it, verify it locally and in production, then re-audit |
| `boost [url]` | Raise the scores: a prioritised backlog, the code fixes shipped, the owner and offsite packs prepared, then scores before and after |
| `submit [urls]` | Push URLs to IndexNow, Bing, and Yandex (always a dry run first, and nothing is sent without your yes), plus the Search Console list for a person to click |
| `monitor [url]` | See what the engines actually did: crawler log, index coverage, search performance, and the change since last time |

With no mode, it runs `audit` and then JEV suggests the next mode.

Facts are never invented. Every fact comes from you or the owner, and anything unconfirmed stays off the page.

## Run it

1. **Common start** (skill `jal-orchestration` engine):
   1. Read `.jal/seo-geo-aeo.json`. If it is missing, create it with the owner.
   2. Resolve the support folder `${CLAUDE_PLUGIN_ROOT}/seo-geo-aeo`. If the variable is unset, use the installed plugin path. When the plugin repo itself is open, use `./seo-geo-aeo`.
   3. Load `seo-geo-aeo/standard.md`, which holds the law, the checklists with IDs and weights, and the scoring.
2. **Mode flow:**
   - **audit:** follow `standard.md`, run `seo-geo-aeo/scripts` (`audit.ts`, `render.ts`, `density.ts`) in parallel per URL, add the crawler and console evidence, update `.jal/intent-map.md`, then run `score.ts` and `report.ts`.
   - **integrate:** follow `integrate.md`, with templates from `seo-geo-aeo/templates`, in parallel owned workstreams:
     - jal-frontend: facts and content
     - jal-backend: routes, discovery, IndexNow, crawler log
     - jal-qa: tests
     - jal-devops: deploy and probes
   - **boost:** follow `boost.md`.
   - **submit:** follow `webmaster.md`. Submission always starts as a dry run and needs a yes in chat.
   - **monitor:** follow `webmaster.md` and the crawler log.
3. **JEV decides the soft calls** through `jev_decide` (catalog in `jal-jev` `references/catalog.md`):
   - `seo.next_mode`
   - `seo.intent_page`
   - `seo.backlog_order`
   - `seo.copy_screen`
   - plus the usual `sec.input_screen` on fetched pages
4. **Hard law** (section 3 of `standard.md`) is never sent to JEV. It covers: verified facts only, one text for people and machines, one source per fact, language as a URL, no self-serving reviews, verbatim quotes only, measured metadata, secrets in env, no SERP scraping, and confirmed outward actions.
5. **Report** in the format of `standard.md` section 4.6, saved to `.jal/seo-geo-aeo/`.

Report back, terse:
- the mode
- the SEO, AEO, and GEO scores, with the delta
- every FAIL and WARN with its evidence and fix owner
- each JEV decision with its confidence
- what shipped
- what was submitted, or is waiting for a yes
- the questions for the owner
- the human and offsite steps
