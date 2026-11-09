# Amit Portfolio — Version 9 (Educational notice · PDFs in Creative · KAN · Analytics)

This update builds on Version 8, including the private CV Studio and editable Work section headings. It does not change any existing Supabase content rows or your existing design system.

## Installation (no Terminal)

**Step 1 — Portfolio Supabase:** In the SQL Editor for your **separate Amit Portfolio Studio project** `oajngclgpbpdccvmrjac`, paste and run the supplied `PRIVATE_ANALYTICS_SETUP.sql` file. It is distributed **separately**, not within the public GitHub update ZIP. You do NOT need to rerun `supabase/schema.sql` or the private CV seed SQL.

**Step 2 — GitHub:** Unzip `amit-portfolio-v9-update.zip`. In https://github.com/amitmayo/amit-portfolio choose **Add file → Upload files** and upload the *contents* of the ZIP's `assets` folder and `build.py`, preserving the paths. Replace old files. Commit to `main`. Check GitHub Actions → Deploy Portfolio for a green checkmark.

**Step 3 — Check:** Hard-refresh the portfolio (`Cmd+Shift+R`). At `/dan/`, sign in, open the **Creative** tab, select a set, choose **Add an image, video or PDF**, select **PDF document**, paste a Cloudflare Worker `.pdf` URL (or upload a PDF under the Supabase 50 MB limit), and add an optional image cover. Save draft then publish.

**Step 4 — KAN:** Under **Professional**, choose a production and a selected episode. Put an official `https://www.kan.org.il/...` URL in the **YouTube / Vimeo / Google Drive / KAN URL** field. Save and publish. Your episode's own page will display a **Watch on KAN 11 ↗** link, opening the official KAN page in a new tab, rather than a broken embedded player. Direct embedding from that broadcaster is not guaranteed; region restrictions or the broadcaster's own availability policies remain outside our control.

**Step 5 — Analytics:** Sign into `/dan/` and choose **Analytics**. View 7, 30, or 90 days of anonymous activity: approximate visits, page views, daily counts, popular paths, referral hostnames, recent entries, and browser-reported time zones. Data starts collecting after **both** the SQL migration and GitHub deployment.

## Exact disclaimer text

> Academic projects displayed here were created for educational and portfolio purposes only. Third-party names, logos, imagery and other materials remain the property of their respective owners. No commercial use, affiliation or endorsement is intended.

It appears below the cards on the Work and Academic Work listing pages and after the PDF viewer on individual academic project pages. The disclaimer does not itself create copyright permissions.

## Analytics and privacy

- The data is anonymous event data. **No IP addresses, names, persistent tracking IDs, or cookies are stored in the analytics table**. A visit is approximated by one browser tab session (`sessionStorage` is used locally, but no session ID is transmitted). Each full page load contributes one page view.
- The **source** is the referral *hostname* (for example, linkedin.com), not a complete referral URL. The **timezone** is from the visitor's browser settings and is *not* verified physical location. The **when** timestamps are recorded in UTC.
- The **Analytics** tab is private to your allowlisted Supabase admin account; visitors cannot read the events. Anonymous insert events are intentionally allowed, so aggressive bot activity or malicious requests can inflate counts. In-browser blockers can reduce counts. The data is for indicative portfolio usage statistics.
- If you later want verified country-level reporting, enable [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/) and use its Country dimension in Cloudflare's dashboard. This cannot be substituted with a browser-timezone guess.
- Privacy requirements, including EU ePrivacy/GDPR, may apply to analytics deployments. Obtain any required permissions or provide a privacy notice as appropriate. The use of sessionStorage for session counting should be evaluated under applicable rules.

## Existing content

The update modifies `build.py` and seven files in `assets/`, and adds `assets/analytics.js`. It does not overwrite `content/site.json`, your `config/backend.json`, uploaded `media/`, Supabase rows, or the CV table. Existing pages and records continue to work.

## Troubleshooting

- **Analytics shows `function not found` or a permission error:** Run the new SQL in the *portfolio* project. Sign out and back in. The account must still be authorized in `portfolio_admins`.
- **No analytics events appear:** Open the public site (not the `/dan/` preview) in a browser that does not block metrics and return to Analytics after a moment. Metrics do not backfill historical visits.
- **PDF fails on mobile:** Use **Open PDF in a new tab** in the Creative gallery; some mobile browsers do not render embedded PDF iframes reliably.
- **KAN episode doesn't play inside the site:** Intended: unsupported broadcaster embeds are opened directly on KAN's original page instead.
