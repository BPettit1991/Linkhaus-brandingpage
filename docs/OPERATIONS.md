# Running a brand portal

## Add or change files
Changed a phone number, service or colour? Edit `brand.config.json`, run `npm run generate` (add `-- --video` if the films show it), check the output, and push.

For other files, put them in the right `kit/` folder (see [KIT.md](KIT.md)), run `npm run check`, then commit and push. The pipeline uploads only changed files and republishes in about a minute. Deleted files are removed from the portal and the bucket.

## Add or remove people
- **Add:** put their email (or `@theirdomain`) on a new line in `access-users.txt` and push. They can sign in within a minute.
- **Remove:**
  1. Delete their line and push.
  2. Run **Actions**, **Brand portal**, **Run workflow** with **Remove people not on the list** ticked. The default run only adds, so a missing line can never lock anyone out.
  3. To cut someone off immediately, also use **Revoke existing tokens** on the Access application in Zero Trust.
- **Rules that only Cloudflare knows about:** domain rules ("Emails ending in") on a separate policy are left alone. The sync edits only the one policy that lists individual people. Set `ACCESS_POLICY_NAME` if several could.

## Rotate the API token
Make a new one with `npm run token-url`, paste it into the `CLOUDFLARE_API_TOKEN` secret, re-run the workflow, then delete the old token.

## Check it's locked
`npm run verify -- brand.example.com` (or the workers.dev address). Every line must say it redirects to Cloudflare Access or is refused. The pipeline runs the same check after each deploy.

## Several brands
- **Use one repository per brand:** create each from this template with **Use this template**.
- **Every brand needs its own Worker and bucket name.** `new-brand` derives them from the short name, and they must be unique within a Cloudflare account.
- **Several brands can share one Cloudflare account and Zero Trust team.** Each gets its own Access app, so each can have its own approved people.

## Troubleshooting
| Symptom | Fix |
|---|---|
| Build: "Uncategorised files" | Move the file into a published folder, or add a `rules` entry. |
| A PDF shows an icon instead of a picture | Add `<folder>/previews/<same name>.png`. |
| Portal header shows the wrong logo | Set `portal.logo` (dark-background SVG) and `portal.icon`. |
| Fonts in the portal look generic | `theme.fonts` points at files that don't exist in `kit/fonts/`; `npm run check` names them. |
| Upload fails on a big video | Files over 300 MB can't be uploaded; export at a lower bitrate. |
| Signed-in users get "Access token rejected" | Re-run the workflow (it re-resolves the team name). If it persists, check `ACCESS_AUD` matches the workers.dev Access app. |
| `verify` says NOT protected | Stop sharing the link. Check Access is enabled on that hostname and `ACCESS_AUD` is set, then re-run the workflow. |

## Local development
```bash
npm run setup && npm run build && npm run preview   # http://localhost:8788, no sign-in
npm test
```
`wrangler dev` also works (`cd portal && echo ACCESS_DISABLED=true > .dev.vars && npx wrangler dev -c wrangler.generated.json`). `ACCESS_DISABLED` only works from `.dev.vars` and must never be set in production.
