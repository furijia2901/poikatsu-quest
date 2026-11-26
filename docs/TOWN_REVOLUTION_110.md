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
