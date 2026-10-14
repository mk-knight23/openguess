# Local progression and interface languages

OpenGuess progression belongs to the browser, without requiring accounts or uploads; optional cloud accounts and community scores are documented separately. The `openguess.progress.v2` local storage key stores a nickname, language, optional sound, reduced motion, family mode, confirmed wins, stardust points, collection, daily completions, and the latest 100 games. Clearing browser storage removes progress; JSON export/import supports manual backup and transfer.

A confirmed win earns 100 stardust plus five points for each question below twenty. Repeated wins earn points, but collection entries remain unique by theme and entity ID. Collection records retain the lowest confirmed question count. Calendar streaks use local dates rather than elapsed 24-hour periods. Achievements are derived from saved progress; they never imply worldwide rarity or server verification. All locally editable scores are for personal enjoyment.

Daily challenges use a deterministic shuffle of sorted unique IDs, seeded by the date or date-and-theme string supplied by the UI. Completions use `YYYY-MM-DD:theme` keys. Stable challenges require stable catalog IDs; updating a pack can change targets. The game stores at most 400 daily keys.

Imports are capped at ten million characters, 20,000 collection entries, 100 recent rounds, and 400 daily keys. Validation rejects dangerous property names, URL-bearing text, invalid scalar types, negative counters, malformed IDs/dates, and excessive arrays. Only known fields are reconstructed. The UI renders names as ordinary text. Storage failures fall back to a fresh profile; save returns a boolean so the UI can explain when persistence is unavailable. Imports are never executed or evaluated.

Interface dictionaries cover English, French, Spanish, Portuguese, German, Japanese, Arabic, Russian, Italian, Chinese, Turkish, Korean, Hebrew, Polish, Indonesian, Vietnamese, Dutch, and Hindi. Arabic and Hebrew have right-to-left direction metadata. These dictionaries translate core navigation and answer controls, not every catalog description or semantic question. Entity names, descriptions, questions, and some explanatory copy remain English. Translation should receive native speaker review before claiming full localization.

Family mode defaults on and is a local preference. A selected setting alone cannot guarantee content suitability; catalog filtering is performed by the UI/catalog layer. No parental account, age verification, or remote controls are claimed.
