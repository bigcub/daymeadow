# daymeadow

See README.md for structure and commands.

## Production safety

- The live Firebase project `daymeadow-55cc0` holds real user data. Never run deploys, data writes or emulator imports against it without asking first.
- Event documents under `users/{uid}/events` are `{ title, date, color, tags? }`. Changes to that shape must be additive and must still read old documents, which may have no `tags` field. Tag limits in `public/js/tags.js` must match `isValidTags` in `firestore.rules`.
- `firestore.rules` changes need a passing `npm run test:rules` before `npm run deploy:rules`. Deploy rules before hosting whenever the site starts writing a new field.
- Local runs use the emulators automatically (see `isLocal` in `public/js/firebase.js`). Keep it that way.

## Conventions

- No build step. Plain ES modules in `public/js`. Keep pure logic in `dates.js` with tests in `test/unit`.
- UI events go through `data-action` attributes and the `ACTIONS` map in `main.js`. Don't add inline `onclick` handlers.
- Keep the CDN Firebase version in `firebase.js` in sync with the npm `firebase` devDependency.
- Run `npm run check` before committing.
