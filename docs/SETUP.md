# First deploy: Cloudflare and GitHub (one-off, about 10 minutes)

The owner of the Cloudflare account does these steps. They can't be scripted, because each one creates or approves a credential. Do them in order.

**Before you start:** the brand's domain must be **on Cloudflare** (its nameservers point at Cloudflare). It must also be in the **same Cloudflare account** the portal will use. Check: Cloudflare dashboard, then the account's home page, which lists its domains.
- **Domain not on Cloudflare yet?** Add it as a site, and copy **every** DNS record across first, especially email: MX, SPF, DKIM, DMARC and autodiscover. Then change the nameservers at the registrar.
- **Mail and Microsoft/Google setup records must be DNS only (grey cloud), never proxied.** A proxied `autodiscover`, `lyncdiscover` or `sip` record breaks Outlook setup.

## 1. Turn on R2
Dashboard, **R2 Object Storage**, **Get started**, accept the terms. The free tier is 10 GB. It may ask for a card even on the free plan. The pipeline creates the bucket itself.

## 2. Create the API token
Run `npm run token-url` and open the link while signed in. It opens **Account API tokens** with exactly these permissions ticked:

| Permission | Why |
|---|---|
| Workers Scripts: Edit | deploy the portal Worker |
| Workers R2 Storage: Edit | upload the kit files |
| Workers Routes: Edit | attach `brand.<domain>` (a zone permission: choose the brand's domain if asked) |
| Access: Apps and Policies: Edit | create the domain's sign-in app and keep the sign-in list in step |

Create it and copy the token: it is shown once. (The dashboard's permission search often hides zone permissions such as Workers Routes; the link avoids hunting for them.)

## 3. GitHub settings
Repo, **Settings**, **Secrets and variables**, **Actions**:

| Type | Name | Value |
|---|---|---|
| Secret | `CLOUDFLARE_API_TOKEN` | the token from step 2 |
| Variable | `CLOUDFLARE_ACCOUNT_ID` | the account ID (account home page, right-hand column, or the URL after `dash.cloudflare.com/`) |
| Variable | `PORTAL_DOMAIN` | e.g. `brand.acme.com.au`. Leave it unset to use only the `workers.dev` address. |

Push (or **Actions**, **Brand portal**, **Run workflow**). The first deploy uploads the kit and publishes the Worker **locked**: every request gets "Portal is locked" until step 4.

## 4. Turn on sign-in
1. **Workers & Pages**, the portal Worker (its name is `portal.workerName` in `brand.config.json`), **Settings** or **Domains**.
2. On the **Production `workers.dev`** row, click **Enable Cloudflare Access**. If there is a **Preview** row, switch it off; the pipeline keeps it off.
3. Click **Manage Cloudflare Access**. Edit the policy so it allows the right people: **Emails** for individuals, or **Emails ending in** `@brand-domain` for a whole team. The first time, Zero Trust asks you to pick a team name; anything works.
4. On the Access application's page, copy the **Application Audience (AUD) Tag**.
5. In GitHub, add the variable **`ACCESS_AUD`** = that tag. Then re-run the workflow.

That run:
- works out your Zero Trust team name (`ACCESS_TEAM` is optional);
- creates the Access app for `PORTAL_DOMAIN` with the same policies;
- attaches the custom domain;
- syncs `access-users.txt`;
- checks the live portal sends signed-out visitors to sign-in.

## 5. Test it
In a private window, open `https://brand.<domain>`:
1. Enter an approved email and type the 6-digit code Cloudflare emails you.
2. Preview a file, download it, and copy a viewer link.

Then try an email that isn't approved: it should never receive a code.

## 6. Invite people
Send the link with three steps:
1. open the link and enter your email;
2. type the code from the email (check spam the first time);
3. you stay signed in on that device for the session length set on the Access app.

Clean-up: delete any older tokens you made while setting this up.

## What can go wrong (all seen in the first build)
| Symptom | Cause | Fix |
|---|---|---|
| "Portal is locked" | `ACCESS_AUD` not set yet | Step 4, then re-run the workflow. |
| "Access token rejected" after signing in | The Zero Trust team was renamed | The pipeline resolves the current name on every deploy: re-run the workflow. |
| Deploy fails on the custom domain | Domain in another Cloudflare account, or no Workers Routes permission | Move the domain into the account; make the token with `npm run token-url`. |
| `DNS_PROBE_FINISHED_NXDOMAIN` for `brand.` | No deploy has run with `PORTAL_DOMAIN` set | Set it and re-run. |
| R2 error 10042 | R2 not enabled | Step 1. |
| Preview URLs reappear | Wrangler turns them on by default | Already handled: `preview_urls: false` in the generated config. |
| Domain added by hand in the dashboard disappears | Deploys replace dashboard routes | Only set the domain with `PORTAL_DOMAIN`. |
