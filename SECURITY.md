# Security Policy

## Supported versions

| Version           | Supported |
| ----------------- | --------- |
| `main` (deployed) | Yes       |
| Older commits     | No        |

ECHO is a single deployed build. Fixes land on `main` and go live from there.

## Reporting a vulnerability

Report privately rather than in a public issue:

- Open a [security advisory](https://github.com/varadharajanv0310/ECHO/security/advisories/new), or
- email **varadharajanv09@gmail.com** with `SECURITY` in the subject.

Please include what you found, how to reproduce it, and what an attacker could
do with it. You should get an acknowledgement within 72 hours and a fix or an
explanation within 14 days.

Please do not run automated scanners against the GitHub Pages host, and do not
test anything that would affect other people.

## Threat model

ECHO's security posture comes mostly from what it does not do. It is worth
stating plainly, because it changes which vulnerability classes apply at all.

**There is no backend.** No server, no database, no API, no authentication, no
session. The entire application is static files served over HTTPS.

**No data leaves the browser.** Profile, signals, carries, friends and messages
are written to `localStorage` on the reader's own machine and read back from
there. Nothing is transmitted anywhere. There is no telemetry, no analytics, no
error reporting service and no third-party script.

**There are no secrets.** Nothing in this repository is confidential, because
there is nothing for a credential to protect. `.env.example` documents that
absence rather than a configuration.

**Everyone else in the sky is generated.** The people, their signals and their
responses are derived from a seed. There is no other user, so there is no
channel from one reader to another and no stored content from anyone else.

What that removes: server-side injection, authentication and session flaws,
IDOR, SSRF, insecure deserialisation on a server, secrets leakage, and any
cross-user attack that would need a shared backend.

## What is actually in scope

| Concern                     | How it is handled                                                                                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **XSS**                     | All rendering goes through React's escaping. There is no `dangerouslySetInnerHTML`, no `innerHTML`, no `eval` and no `new Function` anywhere in the source — this is enforced by lint and verifiable with a grep. |
| **Untrusted input**         | Everything a person types is length-capped at the point of entry and stored as text, never interpreted.                                                                                                           |
| **Stored data**             | `localStorage` only, on the reader's own device, holding only what they typed. Every read and write is wrapped in `try`/`catch`, so a browser with storage disabled degrades rather than breaks.                  |
| **Clickjacking**            | The deployed page carries a Content Security Policy with `frame-ancestors 'self'`.                                                                                                                                |
| **External links**          | Links that leave the site use `rel="noopener noreferrer"`.                                                                                                                                                        |
| **Supply chain**            | Dependencies are pinned by `pnpm-lock.yaml` and installed with `--frozen-lockfile` in CI, which also runs `pnpm audit` on every push.                                                                             |
| **Content Security Policy** | Declared in `index.html`. Scripts and styles are same-origin; the field guide's font CDN is the only third-party origin allowed, and it is allowed explicitly.                                                    |

## Known and accepted

- **`localStorage` is not encrypted.** Anything typed into ECHO is readable by
  anyone with access to that browser profile. This is stated in the interface
  rather than hidden: nothing here is private in the sense of being protected,
  it is private in the sense of never being sent anywhere.
- **The field guide loads two fonts from Google Fonts.** That is one third-party
  request, made by a static documentation page, and the only external origin the
  project touches. The application itself bundles its fonts.
- **`leva` ships behind a `?debug` flag** in production. It is a tuning panel
  for scene constants; it exposes no data and performs no privileged action.
