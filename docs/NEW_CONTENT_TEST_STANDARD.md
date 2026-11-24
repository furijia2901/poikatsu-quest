# New content acceptance standard

For every new player-facing content module, implement a test-only entry point before release.

- Use the same underlying rules as the normal feature, with isolated in-memory fixture state.
- Make the basic content accessible immediately, with sufficient simulated resources, without completing real quests or waiting for weekly resets.
- Cover the primary happy path, locked state, insufficient resources, duplicate prevention, relevant thresholds and reward reveal.
- Include useful fixtures for rare or time-consuming cases (e.g. pity, hidden boss, maximum progression).
- Label all test results clearly and provide reset/exit. Never persist fixture progress, award normal resources, or call production cloud write APIs.
- Include PC/mobile automated checks; verify the normal save, local storage and cloud request count remain unchanged through testing.
- Supply a short real-device checklist and the production URL only after deployment. For cross-device/cloud operations use isolated database fixtures; test mode does not prove real account sync.
- Keep old data compatible; block production release when any release-critical check fails.

## Ver.10.0 coverage
Map and branch selection, difficulty/element, normal/boss/hidden combat, equipment effects, damage/status feedback, reward/duplicate claim, chest collection, growth, summon/pity/insufficient funds, rarity previews, codex filters, reset and isolation. Test-only scenario state is discarded at close/reset.


## Ver.10.5 coverage
- Title and lobby: original presentation, no game-state writes, all navigation, live status, responsive widths and reduced motion.
- Menu: 28 original destinations, Japanese search and aliases, category/recent filters, back and home, collection/inbox/audio/test shortcuts.
- Profile: dedicated device-only preference key, validation, preview, explicit save/reset, isolated test fixture.
- Collection center: 24 routes (8 inventory, 11 summon, 5 codex); original currency, ownership and draw rules unchanged. Test navigation reports only.
- Inbox: session-only news read state, existing native reward screens; isolated single/bulk receipt, locked/expired and duplicate prevention. No new production payout.
- Audio: opt-in, original three BGM scenes and sound effects, independent device-only settings, preview isolation, visibility and reduced-motion safeguards.
- Test center: 10 manual acceptance items, links to original read-only navigation or isolated fixture modes, session-only results, reset and copyable report.
- All production game balances, cloud schema and existing save keys remain unchanged by the presentation shell. Device-specific cosmetic/audio preferences are not cloud-synced.
