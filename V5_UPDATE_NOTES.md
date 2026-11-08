# Amit Portfolio — Version 5 Update

This is a **code-only patch** to the existing `amitmayo/amit-portfolio` GitHub repository. It does **not** replace your Supabase account, database records, uploaded media, site content, or existing deployment setup. It preserves the site’s current styling and layouts.

## What changed

1. **Creative Explorations: Google Drive videos.** The gallery recognizes public Drive file links (including `/file/d/ID/view` and `open?id=ID`) and embeds the Google Drive `/preview` player in the popup instead of handing the share link to an HTML `<video>` element. Includes a separate **Open in Google Drive** link. YouTube, Vimeo, and direct uploaded MP4s continue working.
2. **Academic projects: multiple PDFs.** Each project can store a list of separately titled PDF documents, while older records containing one `pdf` remain supported. The public page displays discreet document buttons above one embedded viewer, so only the selected PDF loads at a time. PDF URLs can point to Supabase or shared Google Drive file links.
3. **Creative sets: bulk images and inline titles.** Choose many local images in one file selection. Each successful image upload gets its filename as an editable title and appears in the media list. Titles can then be edited directly without opening every image. The first image is automatically used as the set cover when no cover has been selected.
4. **More reliable editing.** Prevented the admin preview from resetting the selected episode during programmatic navigation. Serialized draft saves to avoid older saves overwriting more recent changes. Publishing is blocked during an active upload, and nested list edits now keep you in the project. This should address intermittent editor state issues.
5. **Thumbnail reliability.** Creative-set buttons use the first available image, or a video thumbnail, when no dedicated set cover is provided. Missing images show an unavailable-image indicator in the admin list. A separate homepage fallback image bug was corrected.

## Installing without Terminal

1. Extract the ZIP.
2. On GitHub open: https://github.com/amitmayo/amit-portfolio
3. Select **Add file → Upload files**.
4. Upload the contents of the ZIP (not the ZIP itself). Preserve the `assets/` directory and replace existing versions of the six code files. The notes file is optional.
5. Commit to branch `main`.
6. Verify **Actions → Deploy Portfolio** completes with a green check mark.
7. Hard refresh the public website and the `/dan/` admin page (`Command + Shift + R` on Mac).

**Do not replace** `config/backend.json`, `content/site.json`, `supabase/schema.sql`, or the `media/` directory. No new database tables or SQL migrations are required.

## How to use

**Multiple PDFs:** `/dan/` → Academic → select a project → **Project PDF documents** → **+ Add another PDF** → enter a name and upload a PDF or paste a public link → **Save draft** → **Publish changes**. Existing single PDF links migrate automatically the first time you edit and save that project.

**Upload and name several images:** `/dan/` → Creative → select a set → **Upload multiple images together** → choose several JPG/PNG/WebP files → wait until the selected files finish uploading. Their titles appear in inline text boxes, where you can rename them. Then publish.

**Episodes:** `/dan/` → Professional → click `+ Episode` next to a show → fill its title, cover and video URL → **Save draft** / **Publish changes**. Video URLs may use YouTube, Vimeo or a Google Drive share link with public Viewer access.

## Important limits

- Supabase Free still limits uploads to **50 MB per file**. This patch **does not remove that storage limit**. Larger PDFs can be hosted elsewhere and linked from the editor.
- Drive video previews depend on Google's own processing, viewing limits, and sometimes third-party cookies; if playback is blocked, the viewer provides an external Drive link. For a public-facing film, YouTube/Vimeo generally offers a more predictable embed.
- A dedicated image thumbnail should still be uploaded for a Drive-hosted video, because Drive share links are not direct image URLs.
- Removing an item from your portfolio does not delete its uploaded file from Supabase Storage.

## Verification performed

- Rebuilt all **25 pages** successfully.
- Passed JavaScript syntax checks for the changed scripts.
- Browser DOM simulations passed for: multi-PDF navigation; Drive video iframe + external fallback; set-cover fallback; episode creation and draft save; bulk image uploads, inline title edits and cover selection.
- Real Supabase account behavior and Google Drive media permissions **cannot be validated** without your actual account/session or file link. Please test one real episode, one PDF and one Creative set after uploading this patch.
