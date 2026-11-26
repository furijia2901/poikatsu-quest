# Ver.11.0 TOWN REVOLUTION

## Scope and progress weights
1. City map and legacy facility integration — 15%
2. Residential districts, placement and new facility construction — 20%
3. Residents, jobs and population growth — 15%
4. Resource production, storage and bounded offline accrual — 20%
5. City quests, development milestones and unlocks — 10%
6. City customization, specialties and visual progression — 10%
7. Integrated test center, save compatibility and release checks — 10%

Phase 1 is a read-only projection of three original town facilities and four V50 facilities. No migration, new payouts, or new production persistence has been introduced. The existing construction controls remain authoritative and are accessible by selecting the facility on the map. Three isolated scenarios: developed, empty, max.

Later phases require validating the normal save and cloud merge rules before introducing persistence. All new balances must be virtual game resources; no real point/financial balances. Test-only fixtures never award production resources. Reuse existing save protections, avoid duplicate resource claims across tabs/devices, bound offline production, and do not overwrite legacy buildings. Production release requires full regression, desktop/mobile browser checks and relevant database tests. Implementation progress excludes manual real-device acceptance.

Phase 2 adds a separate 6×6 district with 21 buildable plots and 8 building types, level 1–5, exact gold costs, free relocation, invalid-save rejection, isolated construction fixtures. New district state uses optional `town110` in the normal save, with revision conflict handling via the existing save flow; no schema change. Construction requires Web Locks and rejects stale tabs and unresolved account sync. Production account sync must still be tested before release. Residents, production and city rank integration will follow in later phases.

Phase 3 adds stable resident identities, housing capacity (4/Lv), workplace slots (2/Lv), recruitment (50G), free job assignment and derived happiness. Phase 4 adds four virtual resources, fixed-point accrual, twelve-hour uncollected production cap, per-resource storage, talent/worker/administration bonuses and manual crafting. Production is settled under the existing town transaction lock before successful construction or resident changes; older missing production starts at the first successful mutation with no retroactive yield. Reduced capacity never deletes previously earned inventory. Time rollback grants no new production until the stored timestamp is reached. Isolated scenarios cover idle workers, full storage and long absence. Cloud conflict and live transaction regression remain release gates.
