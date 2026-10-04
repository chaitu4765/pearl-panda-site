# Pearl Panda

A responsive six-page React + TypeScript website based on
`Pearl_Panda_Website_PRD_Industries_v2.pdf`.

## Run

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. Production: `npm run build`, then `npm run preview`.
If this Windows machine's global npm wrapper is broken, the installed project
can be started directly with `node node_modules/vite/bin/vite.js --host 127.0.0.1`.

## Features

- Six routes: Home, Services, Industries, About, Work, Contact.
- Six-chapter cinematic hero adapted from the newly supplied Horizon Hero:
  a scroll-driven camera, three layers of pearl-like stars, green aurora, layered
  forest scenery and the Pearl Panda sculpture inside a single Three.js canvas.
- Real Three.js panda-and-bamboo sculpture modeled after the original logo
  embedded in the PRD. Porcelain materials, lighting, pearls and leaf geometry.
- Cursor-reactive perspective, ambient-motion pause, reduced-motion mode,
  offscreen rendering suspension and a WebGL fallback.
- Cursor halo, card tilt/spotlights, section reveals and responsive navigation.
- The opening “Welcome to pearl panda.” uses the reference's staggered title
  reveal. Each chapter includes an original business-growth message. There is
  no video intro, replay control, or blocking welcome screen.
- Across all six chapters, the panda alternates sides as the camera glides
  through the scene. The previous atom-dissolve and decrypt-text hero is retained
  in source history/components but is no longer mounted. Mobile uses a stacked
  layout; reduced motion shows one static, complete welcome.
- Services and packages match the PRD. No invented fixed prices.
- Work examples are clearly labeled fictional concept explorations.
- Project brief form addressed to chaitu4765@gmail.com through FormSubmit, with
  browser-local drafts and a downloadable text copy.

## Structure

`src/components/ui/` contains reusable components, including
`horizon-hero-section.tsx`, `horizon-scene.tsx`, the shared `panda-model.ts`,
interactions and a button primitive.
Tailwind 4 and TypeScript are configured. `components.json` supplies the shadcn
aliases; keeping primitives in `components/ui` provides the conventional target
for future shadcn component additions. `@/` resolves to `src/`.

The original logo is preserved at `public/brand/pearl-panda-original.png`.
The browser icon is a simplified panda mark. Original PDF extraction is
reproducible with `scripts/extract-logo.py` and pypdf.

## Contact setup before publishing

The default form uses a native POST to
`https://formsubmit.co/chaitu4765@gmail.com`. Completed, validated briefs are only
transmitted after the visitor agrees to share their details and clicks **Send
project brief**. Save draft and Download a copy remain local; drafts are never
emailed automatically while typing or saving. A direct email link is also shown.

**Owner activation is required:** submit one harmless test from the final site,
complete FormSubmit’s security check, then open the activation email in
`chaitu4765@gmail.com` (check Spam if necessary) and confirm the address. Submit a
second test afterward and verify it arrives before accepting real enquiries.
No activation email or real submission has been sent during implementation, and
mailbox delivery has not yet been verified. The browser goes to FormSubmit’s own
result page; the site does not claim success before delivery is accepted.

The form supplies named fields, a recognizable `_subject`, the `table` template,
an empty `_honey` spam trap and the visitor’s email as `_replyto`, so Gmail’s
Reply action addresses the visitor. FormSubmit’s reCAPTCHA remains enabled by
default. Its processing is disclosed next to the form and in the consent text.
See [FormSubmit setup](https://formsubmit.co/) and
[official field documentation](https://formsubmit.co/documentation).

Optionally set `VITE_CONTACT_ENDPOINT` in `.env.local` to replace FormSubmit with
your trusted JSON POST backend. It must accept `name`, `email`, `business`,
`service`, `project`, `consent` and `source`, allow the site’s origin, and return
a successful HTTP status only after accepting the enquiry. Add server-side
validation, spam controls and your chosen delivery/storage integration there.
Never put private API keys in `VITE_` variables; they are public client settings.

## Higgsfield footage

The requested generation was attempted, but Higgsfield returned an out-of-credits
error. No AI video clips are represented as generated. The current site uses
native 3D/CSS motion. Prepared motion briefs and integration guidance are in
`docs/higgsfield-motion-storyboard.md`.

The user subsequently supplied a video. External upload was blocked by the
approval reviewer, so the edit was completed locally using FFmpeg. Rebuild that
archived edit with `node scripts/render-intro.mjs`. Outputs are in `public/media/`.
The user later requested removal of the intro: none of these media files are
loaded or played by the site. Original footage and edit files are preserved.

## Hosting

Deploy `dist/` to any static host. Configure a fallback to `index.html` for client
routes; `public/_redirects` supplies this for hosts that support that convention.
No deployment or external publishing has been performed.

## References and assets

- Brand/content: supplied Pearl Panda PRD; original embedded logo.
- Hero choreography: user-supplied Lycoris Specimen by Kedhareswer and local
  Dealate `src/components/ui/logo-specimen.jsx` informed the earlier hero. The
  active cinematic version adapts the user-supplied `horizon-hero-section.tsx`,
  with scoped GSAP/ScrollTrigger and Three.js bloom/output postprocessing.
- Panda: original procedural geometry in this project, not a third-party model.
- Welcome animation: user-supplied Motiq DecryptText, adapted for fixed glyph
  widths, Pearl Panda colors, reduced motion and safe effect cleanup.
- Additional motion reference: [Hey Zillion](https://heyzillion.com/), inspected
  live for pinned scene pacing, continuous particle breakup, copy yielding during
  travel and opposite-side reassembly. Pearl Panda artwork and branding remain
  original; no reference-site media or code was copied.
- Portfolio artwork: original CSS illustrations for fictional brands.
- Typography: Manrope and DM Sans via Google Fonts, with system fallbacks.
- Icons: Lucide. 3D engine: Three.js with locally generated RoomEnvironment.
