# Portfolio Studio — private admin setup

This upgrade is **only for `amitmayo/amit-portfolio`**. It is not connected to Inbar Scout and it must use its **own new Supabase project**.

## What this adds

- `/dan/` — owner-only email/password login and an iframe of your existing portfolio.
- An editor alongside the live visual preview to update homepage images, category covers, academic projects and PDFs, professional episodes and video links, and Creative Explorations mixed-media sets.
- **Save draft** (private) and **Publish changes** (visible to everyone). Your public pages read `portfolio_published` from Supabase. GitHub stays the source of the site's design/code.
- A Supabase Storage media bucket for image, PDF and video uploads. Existing seven academic projects and two documentary productions are preserved as the starting content.

## Step 1 — Create a NEW Supabase project

Go to https://supabase.com/dashboard, choose **New project**, give it a distinct name such as `Amit Portfolio Studio`, and use a strong **database** password saved privately. **Never reuse the Inbar Scout Supabase project.** The database password, service-role/secret keys, and the admin login password must not be placed in GitHub or sent in chat.

## Step 2 — Create the database, roles and storage

In the **new portfolio project**, open **SQL Editor**, paste and run the contents of `supabase/schema.sql` exactly once. This creates:

- `portfolio_admins` — explicit account allowlist;
- `portfolio_drafts` — only accessible to authorized accounts;
- `portfolio_published` — visible to public visitors but editable only by authorized accounts;
- `portfolio-media` — public-file bucket with owner-only uploads and modifications.

Row Level Security is enabled on all three app tables and the storage upload policy uses the same owner allowlist. The browser only uses the Supabase **publishable** key; never the `service_role` key.

## Step 3 — Create your private account

1. Open **Authentication → Users → Add user** in the **new project**.
2. Enter the email you want to use for the private admin login and choose a strong password. If you have an email-confirmation option, follow its prompt.
3. Copy that user's **UUID** from the user detail page (not the password).
4. Back in SQL Editor, run this command with the copied UUID:

```sql
insert into public.portfolio_admins (user_id)
values ('YOUR-NEW-AUTH-USER-UUID')
on conflict (user_id) do nothing;
```

5. In **Authentication → Providers → Email**, disable public signups if the option is available. Keep password sign-in enabled. This is not relied upon for authorization; the database policy still enforces the allowlist.

**Never create an admin user or store a password directly in website source code.** The `/dan/` path is just a discreet entrance; real protection is Supabase authentication plus database/storage policies.

## Step 4 — Connect the website to the NEW Supabase project

In your new Supabase project, locate:
- **Project URL**, formatted `https://xxxxxxxx.supabase.co`;
- **Publishable key** (`sb_publishable_...`, or a legacy `anon` client key if applicable).

Edit `config/backend.json` in the **portfolio GitHub repository**:

```json
{
  "url": "https://YOUR-NEW-PROJECT.supabase.co",
  "publishableKey": "YOUR-NEW-PUBLISHABLE-KEY"
}
```

The publishable key is intentionally client-visible and is safe to put in the public website **when RLS is correctly configured**. **Never substitute a secret/service-role key**. This is separate from the keys and URL used in Inbar Scout.

Saving the file on GitHub triggers your existing `Deploy Portfolio` workflow. It generates `dist/assets/backend.json` and publishes all site files.

## Step 5 — First login and publish

1. Open `https://amitmayo.github.io/amit-portfolio/dan/`.
2. Sign in with your new admin email and password.
3. You'll see a preview of your website on the left and editor controls on the right. Navigate around the preview, or select sections in the editor.
4. Edit, **Save draft**, and use **Publish changes** when you are happy. The first publish copies the built-in content into Supabase; all later edits can be published through the admin without GitHub commits.
5. Check `https://amitmayo.github.io/amit-portfolio/` in a private browsing window to verify that published changes are visible publicly.

## Media notes

- Upload size cap in the provided bucket SQL: **50 MB per individual file**, subject also to your actual Supabase plan limits. External HTTPS PDF/video URLs are supported for larger assets.
- Public media URLs are accessible to anyone who has the URL. **Do not upload private/sensitive material**, even if it is in a draft. Draf​t *content records* are private; the media bucket is public.
- Supabase does not automatically delete unused images when you remove them from a project. You can clean old files in Storage manually later.
- Embed-compatible YouTube and Vimeo links are supported for episode pages. Copyright, provider availability and embedding permissions still apply.
- The browser's native PDF toolbar differs across browsers. PDF embedding on phones may open in a separate tab.
- Public content is loaded dynamically, while the site's design and base routes remain on GitHub Pages. Visitors get the last built-in content if Supabase can't be reached (it will not show unpublished drafts).

## If something is wrong

- **Admin says not connected**: make sure GitHub `config/backend.json` is populated and the Pages deployment succeeded.
- **Unauthorized**: your account UUID must appear in `portfolio_admins`, created using the SQL Editor.
- **Permission denied**: rerun/check `supabase/schema.sql` only after checking whether policies already exist (running the full file twice will conflict on policy names).
- **Uploading fails**: check the file type/size and the Storage bucket's policies.
- **Publishing fails**: verify the new project URL/key and the `portfolio_published` grants/policies.

## Rollout/rollback

Do not delete your original `content/site.json`, original site design, or previous GitHub commits. If you need to roll back, GitHub can restore the prior code. Before doing major edits, **Save draft** and keep a local export of `content/site.json`. A later enhancement can add full version history and a media library with deletion controls.
