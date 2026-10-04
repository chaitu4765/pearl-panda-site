# Verification

Verification record for 2026-10-04. The current website uses the Horizon hero.
The earlier video-intro, atom-transfer and decrypt-hero results below are
historical and must not be treated as regression results for the current hero.

## Current: Horizon hero and reduced panda shine

- The current hero adapts the supplied Horizon camera effect into one Three.js
  renderer with six alternating panda compositions, a pearl/sage/gold starfield,
  green aurora, layered forest horizons and cursor parallax. The original
  logo-derived panda geometry is shared through `panda-model.ts`.
- Panda porcelain and forest-green materials now use a satin finish: roughness
  0.62/0.64, zero metalness and low clearcoat. The scene also reduces direct and
  environment lighting, reduces bloom strength and raises its threshold. Tiny
  eye glints remain; the aurora's exposure is unchanged.
- Desktop screenshot review confirmed ivory facial detail, dark forest-green
  patches and soft satin highlights, without the earlier blown-out glow.
- TypeScript checking (`tsc --noEmit`) passed for the scene and material changes.
- The implementation includes responsive mascot sizing, paused/reduced-motion
  rendering, offscreen/tab suspension and WebGL/post-processing resource cleanup.
  These are implementation details, not claims of a completed browser suite.
- The full browser regression attempt could not complete because its CDP
  connection timed out. Build/check tools were unusually slow; no completed
  current production-build result is recorded in this update. The historical
  suite and build passes below do not establish a pass for this revision.

## Historical: original site and removed video intro

- TypeScript strict compilation and Vite production build passed.
- 62 browser checks passed across all six routes, 1440px/390px/320px widths,
  six hero scenes, WebGL canvas, mobile navigation, portfolio filters/dialogs,
  project brief prefilling, saving/restoring/removing drafts, file download,
  reduced-motion flow and absence of uncaught browser errors.
- 23 intro checks passed: desktop/mobile first visit, inert background,
  deferred 3D, muted playback, 4.13-second 1280×720 clip metadata, Skip, natural
  completion, replay, Escape, scrolling restoration, session-only display and
  reduced-motion bypass.
- Visual checks: desktop and mobile hero, alternate scroll scene, services,
  contact, portfolio, and video intro.
- Axe checks on all six routes found no remaining automated violations after
  correcting text contrast and an inline link lacking an underline. Some
  gradient/canvas backgrounds and overlapping concept artwork still require
  visual contrast review; automated scans do not certify full accessibility.

Test artifacts are stored in ignored `tmp/verification/`. Scripts are in
`scripts/verify-browser.mjs`, `scripts/verify-updates.mjs`, and
`scripts/verify-welcome-contact.mjs`; they accept a CDP URL and a Playwright module
path so the same flows can run against a local browser. The obsolete intro test
was removed together with the intro component.

The first command-line browser download check was canceled by its driver.
An independent Playwright context with downloads enabled successfully downloaded
and inspected the complete brief; no website download fault was reproduced.

## Historical: atom-transfer and decrypt-hero follow-ups

- The former hero alternated sides through all six chapters, using surface-sampled
  particles before each move and automatic 200ms reconstruction after arrival.
- `scripts/test-hero-transfer.mjs` checks 1,001 timeline samples, forward/reverse
  symmetry, departure gating and immediate reconstruction targets at arrival.
- 35 checks passed in `scripts/verify-updates.mjs`: each crossing, automatic
  reconstruction with scroll stopped (forward and reverse), mobile layout,
  reduced motion and absence of WebGL/browser errors.
- 24 welcome/contact browser checks passed: intro removed and never fetched,
  accessible decrypt heading, all growth messages, responsive widths, static
  reduced-motion text, Gmail recipient, local-only saving/downloading, required
  consent, and complete POST fields. Every FormSubmit request was intercepted
  locally; no test email was sent and mailbox delivery is not yet verified.

## Contact delivery status

- Gmail submissions use FormSubmit. The owner must submit a harmless test and
  confirm the activation email in chaitu4765@gmail.com, then verify a second test
  arrives before accepting live enquiries. CAPTCHA remains enabled.

Higgsfield generation previously returned an out-of-credits error. The supplied
intro was edited locally after external upload was blocked by approval review;
its media is preserved but no longer loaded or played by the website.
