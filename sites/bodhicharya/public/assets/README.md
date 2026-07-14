# Assets

Real images scraped from the live `bodhicharyafoundation.org` (Webflow-hosted) and wired into the
static rebuild:

```
assets/
  icons/     healthcare.png, education.png, spiritual.png — "What we do" / Programs card icons
  photos/    community-1.jpg .. community-6.jpg — resized/compressed community photos, used in
             the "Moments from our community" gallery on index.html
  team/      team-<name>.png — team member photos, used on team.html
  favicon/   favicon.ico, favicon.png — site favicon, replaces the earlier CSS placeholder
```

Photos and team headshots were downsized (max 1600px / 480px respectively) and re-compressed with
`imagemagick` for reasonable page-weight — the originals from Webflow's CDN were much larger
(multi-megabyte, full-resolution phone camera photos).

Still missing / bring in later:

- A real **logo** — `.brand-mark` in `css/style.css` is currently a plain CSS gradient placeholder.
- The Nepal Companies Act **registration certificate** (PDF), if you want to link it from the
  About/Registration section.
- Any additional/updated program or event photos beyond what was on the live site.
