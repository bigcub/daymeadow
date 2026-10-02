# daymeadow

Count down to the days that matter. Sign in with Google, add dated events, and see them as countdown cards or on a calendar.

Live at https://daymeadow-55cc0.web.app (Firebase project `daymeadow-55cc0`).

## Stack

- Static site in `public/`, with no build step. Native ES modules load the Firebase JS SDK from the gstatic CDN.
- Firebase Auth (Google sign-in), Cloud Firestore and Hosting.
- Events live at `users/{uid}/events/{eventId}` as `{ title, date: 'YYYY-MM-DD', color, tags? }`. `tags` is optional (up to 5, each up to 24 characters). Untagged events, including every event saved before tags existed, have no `tags` field.

```
public/
  index.html      markup
  css/styles.css  all styles, light and dark
  js/main.js      UI: rendering, dialogs, auth state
  js/firebase.js  Firebase setup and data access
  js/dates.js     pure date helpers (unit tested)
  js/tags.js      pure tag helpers (unit tested)
  js/samples.js   sample events shown while signed out
firestore.rules   security rules (tested in test/rules)
```

## Development

Requires Node 22+ and, for the Firestore emulator, Java 21+.

```bash
npm install
npm run dev          # emulators: hosting on :5002, auth, firestore, UI on :4000
npm run dev:no-java  # hosting + auth only, if Java isn't installed
```

On `localhost` the app connects to the emulators under the `demo-daymeadow` project, so local development never touches live data. Sign in through the auth emulator's fake Google account picker.

## Checks

```bash
npm run check       # lint, format check, unit tests
npm run test:rules  # security rules against the Firestore emulator (needs Java)
```

CI runs all of these on every push and pull request.

## Deploying

There is live user data in production. Deploy hosting and rules separately, and deploy rules only after `npm run test:rules` passes.

When a change adds a field, deploy the rules first so the new site's writes are accepted.

```bash
npm run deploy:rules
npm run deploy:hosting
```

Avoid a bare `firebase deploy`, which pushes everything at once.

## Upgrading Firebase

The browser loads the SDK from `https://www.gstatic.com/firebasejs/<version>/` in `public/js/firebase.js`. Dependabot only bumps the npm `firebase` package, which the rules tests use, so update the CDN version by hand to match.
