# Amit Dahan Mayo — Portfolio

Minimal, personal, image-led multi-page portfolio. **Completely independent of Inbar Scout.**

## Website

- Home with random project photography, centered introduction and minimal *Let's explore* link.
- Work → Academic Work (cover + brief description + PDF viewer), Professional Work (production description, role + selectable episode cards with dedicated YouTube/Vimeo player pages), Creative Explorations (mixed photo/video sets with fullscreen viewer).
- About and Contact.
- Existing visual design kept: near-black background, refined classic serif/typewriter font combination, off-white text, burgundy details.

## NEW: Portfolio Studio (`/dan/`)

Owner-only email/password access through a **new, separate Supabase project**, draft and published content, and media upload. The private editor shows a preview of the actual website while you edit.

**Start with [ADMIN_SETUP.md](ADMIN_SETUP.md) for the one-time setup.** The backend is intentionally **disconnected** until you provide your own new Supabase Project URL and publishable key in `config/backend.json`.

### Where content lives

- `content/site.json`: built-in fallback content and the default content of the initial admin draft.
- `config/backend.json`: public Supabase URL and **publishable** key only (never secret keys).
- `supabase/schema.sql`: database tables, RLS policies, storage bucket and admin rules.
- `assets/admin.js` / `assets/admin.css`: private editor UI.
- `assets/live.js`: public website live data loader and draft iframe preview.
- `build.py`: Python static-site generator; maintains old routes and creates dynamic placeholders for new projects.
- `dist/`: generated output (do not edit it by hand).

### Local development

```bash
SITE_BASE_PATH=/amit-portfolio python3 build.py
python3 -m http.server 4173 --directory dist
```

If using a local root URL instead of the GitHub Pages `/amit-portfolio/` prefix, run `python3 build.py` without `SITE_BASE_PATH`.

### Deploy

Your existing GitHub Pages workflow runs `SITE_BASE_PATH=/amit-portfolio python3 build.py` and publishes `dist/`. Every code change will trigger deployment. Once Supabase is configured, publishing ordinary content through `/dan/` does **not** require a GitHub deployment.

No public account signup, secret keys in the client, or changes to Inbar Scout.
