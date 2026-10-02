# daymeadow

See README.md for structure and commands.

## Production safety

- The live Firebase project `daymeadow-55cc0` holds real user data. Never run deploys, data writes or emulator imports against it without asking first.
- Never change the shape of event documents (`title`, `date`, `color` under `users/{uid}/events`). Existing documents must keep working. If a schema change is ever needed, it must read old documents too.
- `firestore.rules` changes need a passing `npm run test:rules` before `npm run deploy:rules`.
- Local runs use the emulators automatically (see `isLocal` in `public/js/firebase.js`). Keep it that way.

## Conventions

- No build step. Plain ES modules in `public/js`. Keep pure logic in `dates.js` with tests in `test/unit`.
- UI events go through `data-action` attributes and the `ACTIONS` map in `main.js`. Don't add inline `onclick` handlers.
- Keep the CDN Firebase version in `firebase.js` in sync with the npm `firebase` devDependency.
- Run `npm run check` before committing.
