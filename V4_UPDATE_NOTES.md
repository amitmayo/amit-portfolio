# Amit Portfolio — Version 4 (November 8, 2026)

This update changes **only website code**. Your existing Supabase project, published content, saved drafts, project descriptions, media uploads, API key and deployment workflow stay in place. **Do not replace or reset the database.** No SQL migration is required.

## Changes

1. Home: dark/burgundy tint is retained on Explore hover, instead of washing the picture bright and making text hard to read.
2. Home: manage as many hero images as you want in Portfolio Studio → Home, by multi-upload or adding HTTPS image URLs. On a new public page load, the site chooses one of them and avoids the previous image when it can. Inside the admin preview the image stays stable while you edit its framing.
3. Academic PDFs: public Google Drive **file share links** are converted automatically into embedded `/preview` viewers. For a PDF over 50 MB, upload it to Google Drive, open Share → General access → **Anyone with the link** → **Viewer**, copy the *file* link, paste it into Admin → Academic → [project] → Complete PDF document, and test the link in a private/incognito browser window. The visitor can also open the document in a new tab. If Google Drive access is restricted by your account/organization, use another public PDF host or optimize the original PDF. Google Drive content sharing can expose your Google account owner name/email.
4. Crop/zoom: on any uploaded cover in Work, Academic, Professional or Creative sets (and on visual thumbnails), the editor provides Horizontal position, Vertical position and Zoom controls with a preview. Homepage pictures can be individually cropped using **Adjust crop**. Click Save draft / Publish as usual.
5. Professional: click **Professional** in the editor, then **+ Episode** beside *Zman Emet* or *Tiberias*. The episode editor opens immediately; add the title, episode image and YouTube/Vimeo URL. Another **+ Add another episode** action appears inside the episode editor. Drafts now auto-save after editing inactivity; use **Publish changes** to update the public website. New episodes have their own player pages and large thumbnail cards.
6. Creative Explorations: selecting a set opens the media in a popup over the category page; a single image/video displays alone, multiple items have left/right arrows and an optional **Grid view** to choose a thumbnail. Existing direct set-page URLs continue to work.
7. Home: the heading starts typing, followed by the introduction, with a blinking caret after its last character. Reduced-motion settings display all text immediately.

## Deploy on GitHub (without Terminal)

1. Extract `amit-portfolio-admin-v4-update.zip`.
2. Go to https://github.com/amitmayo/amit-portfolio → **Add file → Upload files**.
3. Upload the **contents** of the extracted folder, preserving the `assets/` folder. Overwrite the six code files. You may also upload this notes file.
4. Commit to `main`.
5. Watch **Actions → Deploy Portfolio** for a green check mark. Refresh https://amitmayo.github.io/amit-portfolio/ and https://amitmayo.github.io/amit-portfolio/dan/ (hard-refresh if your browser caches files).

### Important
- **Do not upload or replace** `config/backend.json`, `content/site.json`, `supabase/schema.sql` or `media/` for this update. Your saved portfolio content lives in your portfolio Supabase database.
- The Supabase Free-plan PDF limit is **50 MB per individual file**. This update does not bypass that limit. It adds support for public Google Drive preview links, which can host a large PDF outside Supabase.
- Preview/editor interactions were verified using simulated data and automated browser checks; the real Supabase account cannot be tested without your login. If an error appears, share its text or a screenshot (never a password or secret key).
