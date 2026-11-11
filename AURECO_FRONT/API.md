# What the backend must provide

All bodies are JSON. Errors should return a non-2xx status and, ideally, `{ "message": "text to show the person" }`.
Send CORS headers that allow the frontend's origin, the `Authorization` header and the methods below.

## POST /api/auth/login

Request

    { "role": "student", "id": "2023-0148", "password": "secret" }

`role` is `student`, `staff`, `supervisor` or `admin`. `id` is the school email or school ID.

Success (200)

    { "token": "opaque-or-jwt-string", "userId": "u_jordan" }

`userId` must match the `id` of a user inside the data returned by `GET /api/state`.

Failure: `401` with a message (wrong password, wrong role, or an account that is pending,
rejected or deactivated).

All later requests send `Authorization: Bearer <token>`. To use cookies instead, set
`WITH_CREDENTIALS: true` in `js/config.js`, return `{ "userId": "..." }` without a token, and
enable credentialed CORS.

## POST /api/auth/logout  (optional)

Ends the session. Reply `204`.

## GET /api/state

Returns the data the signed-in person may see, as one JSON object in the shape the app uses
(`v: 2`, `users`, `perms`, `projects`, `acts`, `letters`, `assess`, `notes`, `finals`, `reports`, `log`, ...).

To see the exact shape, open the demo (`USE_BACKEND: false`), sign in, and run
`JSON.stringify(window.__spw.S)` in the browser console. Use that as your starting data.

Reply `401` when the token is missing or expired; the app then sends the person back to sign in.

## PUT /api/state

Body: the same object, with the person's changes. Reply `204` (or `200`). The app sends it about
0.6 seconds after the last change. Reply `413` if the body is too large.

Notes

* Profile photos and certificate images are stored inside this object as small `data:` image
  strings (certificates are resized to 800px). Allow request bodies of at least 10 MB, or use
  separate upload endpoints.
* Do not trust the PUT body blindly: check on the server what this person may change.

## Next step: per-resource endpoints

For production, replace the single state endpoint with endpoints such as `/api/me`, `/api/grades`,
`/api/projects`, `/api/activities`, `/api/letters`, `/api/people` and `/api/certificates`
(multipart upload). Only `js/api.js` and the `save()` calls in `js/app.js` need to change.
