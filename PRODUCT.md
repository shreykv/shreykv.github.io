# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One site, three audiences, one owner (Shrey Vasisht, NC State student).

- **Portfolio visitors:** recruiters and hiring managers, research and lab contacts, and potential collaborators. They arrive from LinkedIn, GitHub, or a résumé link, usually skimming on desktop between other candidates, and need to judge quickly whether Shrey is credible and worth contacting. No single conversion outranks the others; the goal is a credible professional presence that leads to a message.
- **Personal hub user:** primarily Shrey himself, signed in, using his own tools (gym log, tournament generator, counters, focus timer, stock screener) in day-to-day life. The stock screener doubles as a portfolio demo and is public: visitors reach `#/personal/screener` without an account and see a visitor nav (Back to Portfolio, Sign in). Every other hub route needs a sign-in. Sign Up stays open so other people can use the tools.
- **Pour Decisions crews:** groups of friends on a night out, each person on their own phone, standing in a bar, logging drinks with one hand and checking standings between rounds. Today that is Shrey's own crew; the product is built so any group of strangers can pick it up without help.

## Product Purpose

- **Portfolio (`index.html`):** show Shrey as a product engineer and researcher who builds sensor-driven test systems, embedded prototypes, and data pipelines, and make it easy to reach him.
- **Personal hub (`personal.html`, `js/`):** a private, synced set of small utility apps Shrey actually uses, and a working proof that he ships software end to end.
- **Pour Decisions (`pour-decisions/`):** a shared, live drink board and bar crawl tracker. Someone starts a crawl, shares a code, everyone joins and logs what they drink; the board keeps standings, stats, awards, the tab, and a TV mode for a shared screen. Success is a crew using it through a whole night without anyone needing to explain it.

## Positioning

- **Portfolio:** the portfolio itself is evidence: a hardware and test-engineering profile backed by real, running software built by the same person (the screener and the hub). Pour Decisions is deliberately kept off the portfolio: Shrey doesn't want it representing him professionally, so it is linked only from the personal hub. Never add it, link it, or mention it on `index.html`.
- **Pour Decisions:** no accounts, no installs. A six-character code read aloud across a bar is the entire onboarding, and the code alphabet drops look-alike characters (0/O, 1/I/L) so it is typed right the first time.

## Operating Context

- Portfolio visits are short and comparative; visitors scan the hero, project cards, and skills, then go to LinkedIn, GitHub, or email.
- Hub tools are used in short, repeated sessions (logging a set at the gym, running a focus timer, checking the weekly screener run).
- Pour Decisions runs in noisy, dim, distracted conditions on phones, often one-handed and after a few drinks; a crew may also put the board on a TV. Crawls you started or joined are remembered on that phone.
- The stock screener's data comes from a local Python engine (Streamlit UI, yfinance) that runs weekly against the S&P 500 and syncs results to Supabase for the web view.

## Capabilities and Constraints

- **Stack:** static HTML, CSS, and vanilla JavaScript served from GitHub Pages (`shreykv.github.io`); no build step. Local dev via `npm start` (`http-server` on port 8000). Pour Decisions' board uses Preact-style `html` templates inside a single `board.html`.
- **Data:** Supabase for hub auth and sync (with a localStorage fallback and a migration path from localStorage) and for Pour Decisions' shared state (`goofproof_docs` table; the anon key is public by design and row policies govern access).
- **Routing:** the hub uses hash-based client routing (`#/personal/...`) because GitHub Pages has no server routing; `404.html` exists.
- **Contact form:** static; it opens the visitor's mail client via `mailto:` rather than posting to a service.
- **Pour Decisions:** no accounts; anyone with a crawl's code can join and log drinks. Codes are six characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789`. Board sections: the board, the crawl, stats, the tab, recap, crew and settings, TV mode. Theme options: device, dark ("After dark"), light ("Daylight").
- **Hub apps:** gym log, tournament generator (single/double elimination, round-robin), counters, focus timer, stock screener (Warren Buffett, Lower Risk, and Balanced Risk strategies, with a performance chart). Gym log and counters export JSON.

## Brand Commitments

- **Name and identity:** Shrey Vasisht, "Product Engineer • Researcher • Builder." Profiles: LinkedIn `linkedin.com/in/shreyvasisht`, GitHub `github.com/shreykv`, email `shreykv@gmail.com`.
- **Portfolio voice:** first person, practical, measurement-minded ("prototype → measure → learn → ship"; "If it can't be measured, it can't be improved.").
- **Pour Decisions** is its own brand: the "Pour **Decisions**" wordmark, a playful crew voice ("You're with the crew." "We'll keep the receipts."), and section names *The Board*, *The Crawl*, *The Race*, *The Mix*, *The Tab*, *Awards*. Its existing implementation is its own visual authority and is not restyled to match the portfolio.

## Evidence on Hand

- **Real, working projects:** the Stock Strategy Screener (linked from the portfolio at `personal.html#/personal/screener`), the personal hub apps, and Pour Decisions.
- **Unconfirmed portfolio projects:** of the placeholder cards in `index.html` (Design of Experiments Toolkit, Embedded Sensing Prototype, Production Automation Upgrade, Predictive Quality Model, Data Product: Metrics & Alerts), some are real and some are filler. Do not present any of them as real work, add detail, or invent outcomes for them until Shrey confirms which ones are real.
- **Absent:** project images, testimonials, employer names, metrics, publications, and press. Do not fabricate any of these.
- **Pour Decisions assets:** `pour-decisions/icon.svg` and self-hosted fonts in `pour-decisions/fonts/`; `apple-touch-icon.png` is referenced but not in the repo.

## Product Principles

1. **Show, don't claim.** The strongest evidence is software people can open and use; link to it before describing it.
2. **Truth over filler.** Placeholder content stays clearly unfinished rather than dressed up as real work.
3. **Zero setup at the point of use.** Pour Decisions works from a code alone, and hub tools open straight to the task.
4. **Built for the real moment.** Design for the actual setting: a recruiter's quick skim, a gym set, a dark bar.
5. **Each product keeps its own voice.** The portfolio is professional; Pour Decisions is a party; the hub is a utility.

## Accessibility & Inclusion

No formal standard has been set. Pour Decisions is used in low light and by people who may be impaired, which raises the bar for legible contrast, large tap targets, and forgiving input; its existing code already uses visible focus rings, live-region status messages, and labelled controls.
