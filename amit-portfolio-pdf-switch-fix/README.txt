AMIT PORTFOLIO — MULTIPLE PDF VIEWER FIX

AFFECTED FILE:
  assets/app.js

WHAT IT FIXES
  - Opens a clean PDF iframe when switching documents, instead of reusing a
    browser PDF viewer that may stay blank or show the old file.
  - Remembers which document was selected when Admin Mode refreshes its preview.
  - Keeps the correct "Open document" link aligned with the selected PDF.
  - Does not change project records, PDF URLs, layout, styling, Supabase,
    Cloudflare Worker or R2 storage.

HOW TO INSTALL (NO TERMINAL)
  1. Extract this ZIP.
  2. Open: https://github.com/amitmayo/amit-portfolio/tree/main/assets
  3. Select Add file > Upload files.
  4. Upload ONLY app.js from this ZIP's assets folder.
  5. Commit to main, then verify Deploy Portfolio in GitHub Actions is green.
  6. Open your academic project, hard-refresh (Cmd+Shift+R), and switch between PDFs.

IF THE SECOND FILE STILL DOES NOT LOAD
  - Click "Open document" after selecting the second PDF.
  - If the direct URL fails, the underlying PDF URL / Worker / file name is
    the problem, not the document selector.
  - Verify that your Cloudflare Worker URL ends with the correct, URL-encoded
    PDF object filename and that the original PDF opens directly in a new tab.
  - Send the failing PDF URL and error text for targeted diagnosis.

No SQL migrations, passwords or API keys are needed.
