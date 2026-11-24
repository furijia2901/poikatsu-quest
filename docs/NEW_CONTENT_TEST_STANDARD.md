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
