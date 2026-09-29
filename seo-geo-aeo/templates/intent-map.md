# Intent map: <Brand>

Built and updated by `/jal-seo-geo-aeo audit` (standard.md 4.2 step 6) and read by `integrate` and `boost`. One row per cluster. Prompts are written the way people type them into an assistant, in each published language. `seo.intent_page` (JEV) decides whether a cluster gets its own page, an FAQ entry, a key fact, or is skipped.

- **Status:** `strong` (the answer is on the URL, in its first sentence, with markup), `weak` (partial, buried or unmarked), `empty` (not on the site), plus `offsite-dependent` when assistants answer it from third-party pages.
- **Gap cause:** `content` (write it), `owner fact` (ask the owner; never infer), `markup`, `crawl` (not yet read by the bots, see the crawler log), `listicles` or `directories` (offsite, see offsite.md).
- **Coverage (AEO-02):** strong clusters / all clusters = <n>%. WARN below 70%, FAIL below 50%.

| Cluster | Prompts (ID / EN) | Required answer | URL | Status | Gap cause |
|---|---|---|---|---|---|
| Location list-intent | tempat X di <kota> / where to X in <city> | name, address, landmark, hours | home FAQ, guide | strong on site, offsite-dependent | listicles |
| Cheapest time | jam berapa X paling murah / cheapest time to X at <Brand> | band hours and price | rates table and FAQ | empty | owner fact |
| Price | berapa harga X di <Brand> / how much is X at <Brand> | price from, per unit, bands | /rates | | |
| Opening hours | jam buka <Brand> / what time does <Brand> open | hours per day, closes 23:59 | home key facts, FAQ | | |
| Contact | nomor WhatsApp <Brand> / <Brand> phone number | phone, WhatsApp, email | /contact | | |
| Beginner | cara main X untuk pemula / how to start X | steps, booking, gear | /guide (HowTo) | | |

## Question queries from Search Console (AEO-12)

| Query | Language | Impressions (28 d) | Mapped to | Action |
|---|---|---|---|---|
| | | | | |
