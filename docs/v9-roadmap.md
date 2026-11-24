# POIKATSU QUEST Ver.9.0 — STAR EXPEDITION

## Design pillars
- Connect existing real-world quest modes rather than replace their reward systems.
- Progress from already recorded completions; no purchases, ad watching or spending requirement beyond existing optional quests.
- Weekly periods: Monday 00:00 JST. Missed weeks do not cause loss of existing assets.
- Keep Ver.8.2 production save and cloud behavior intact. Live backup restore remains a separate, unreleased experiment.

## Scope / production completion estimate
| Phase | Weight | Scope |
|---|---:|---|
| 1 | 15% | Read-only expedition hub, three routes / nine checkpoints, period and rank calculation, responsive progress UI |
| 2 | 20% | Rotating route variants, route choice, exploration encounters and meaningful difficulty options |
| 3 | 20% | Expedition combat and bosses, deterministic testable mechanics and balancing |
| 4 | 20% | Reward ledger, idempotent claims, cloud conflict handling and migration; no live rewards before validation |
| 5 | 15% | Collectibles, expedition shop, cosmetic unlocks and optional long-term milestones |
| 6 | 10% | Integrated polish, accessibility, mobile layout and code fixes |

Production percentages measure completed implementation only; runtime/manual verification and deployment are reported separately. Scope can be adjusted with transparent estimates rather than claiming completion based on test counts.

## Phase 1
Three permanent route templates reset weekly: Golden Road (point activities), Starwind Forest (outdoor activities), Star Citadel (both). Conditions are derived from dailyQuestStats, questHistory and outdoorQuest.completedSessions, with duplicate outdoor IDs excluded. Ranks are display-only. Locked checkpoints can show current progress, but only unlock sequentially. There is no new saved state or claim action.

## Release gates
- Automated tests on exact release commit; browser check on PC and mobile.
- Preserve original game progress and cloud behavior; no new keys on Phase 1.
- Later reward phases require durable unique claim IDs, duplicate/replay tests, cross-device conflict tests and a rollback strategy before activation.
- Use a feature branch and PR; only release verified increments.
