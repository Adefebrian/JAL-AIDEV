# SEO, AEO and GEO report: <site>

Mode: <audit | integrate | boost | monitor>. Date: <YYYY-MM-DD>. Previous audit: <YYYY-MM-DD or none>.
Saved as `.jal/seo-geo-aeo/audit-YYYY-MM-DD.md` so the next run can show the delta (standard.md 4.6).

## 1. Scores

| Pillar | Score | Band | Delta |
|---|---|---|---|
| SEO | <0 to 100> | <strong 90 to 100, needs work 70 to 89, weak below 70> | <+n or n/a> |
| AEO | | | |
| GEO | | | |

`pillar score = round(100 x sum(weight x status) / sum(weight of applicable items))`, with PASS 1, WARN 0.5, FAIL 0. N/A and unverified human items are excluded, never guessed as PASS. F-01 to F-04 count in every pillar.

## 2. Items per pillar

### SEO

| ID | Item | Status | Evidence | Fix | Who |
|---|---|---|---|---|---|
| SEO-01 | robots.txt | PASS / WARN / FAIL / N/A | <URL, value, or file:line> | <what to change> | code / owner / human |

### AEO

| ID | Item | Status | Evidence | Fix | Who |
|---|---|---|---|---|---|
| AEO-01 | Intent map | | | | |

### GEO

| ID | Item | Status | Evidence | Fix | Who |
|---|---|---|---|---|---|
| GEO-01 | AI crawlers allowed | | | | |

### Unverified (human items the owner has not confirmed)

| ID | Item | What the owner confirms |
|---|---|---|
| SEO-16 | Search Console, Bing and Yandex verified | |

## 3. Why it may not be showing up yet

- **Crawl coverage** (crawler log, last 14 days): which key URLs bingbot, OAI-SearchBot or ChatGPT-User, PerplexityBot and ClaudeBot have and have not read.
- **Index state** (consoles): URL Inspection verdicts for the key URLs; coverage from Search Console and Bing.
- **List-intent dependence:** the clusters answered from third-party listicles and directories (intent map), and whether the brand is on them.

Content quality is never named as the cause without this evidence.

## 4. Questions for the owner

1. <fact needed, why, which item it unblocks>

## 5. Human steps

- Consoles (webmaster.md 7.2): <what is left>.
- Business Profile, Bing Places, Apple Business Connect (offsite.md): <what is left>.
- Offsite packs prepared: <list, with paths>.

## 6. Backlog (boost only)

| # | Item | Impact | Effort | Status |
|---|---|---|---|---|
| 1 | <ID and fix> | <weight x (1 - status)> | S / M / L | done / waiting on owner / human |
