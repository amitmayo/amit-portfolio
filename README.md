# Amit Dahan Mayo — Portfolio

A minimal, image-led, multi-page personal portfolio. **This is a completely separate project from Inbar Scout.**

**Design:** near-black `#171719`, warm off-white `#f3eee9`, and muted burgundy `#944a5c`.

**Built with:** static HTML/CSS/JavaScript and a tiny Python build script. No npm packages, subscriptions, frontend frameworks, tracking scripts, or database are required. Uses Google Fonts for refined editorial and typewriter typography, with system fallbacks. Pages are generated from one editable content file, so the result is easy to host on GitHub Pages or Vercel.

## Site structure

- `/` — centered fullscreen introduction with randomly changing image on each visit, dark-to-clear hover effect, and a subtle *Let's explore* link (no homepage navigation)
- `/work/` — three large image-backed category buttons
- `/work/academic/` — Istituto Marangoni introduction and seven academic projects
- `/work/academic/<slug>/` — large cover, 1–2 sentence description, PDF embedded in the browser-native viewer
- `/work/professional/` — two documentary productions
- `/work/professional/<slug>/` — show description, Amit's verified role, large clickable episode cards
- `/work/professional/<slug>/<episode>/` — dedicated YouTube or Vimeo episode player
- `/work/creative-explorations/` — image-led visual collections
- `/work/creative-explorations/<slug>/` — photos/videos in a gallery with fullscreen viewer
- `/about/` and `/contact/`

## Run locally

Requires only Python 3.9+.

```bash
python3 build.py
python3 -m http.server 4173 --directory dist
```

Open **http://localhost:4173/** in your browser.

After editing the text, images or projects, run `python3 build.py` again. Refresh your browser.

## Where to add content

All editable copy, titles, URLs and project lists are stored in **`content/site.json`**. Put the media files in the dedicated folders below and reference them by their path in JSON:

| Folder | What to upload |
| --- | --- |
| `media/home/` | Full-width rotating homepage photos |
| `media/categories/` | Images used on the three big Work category buttons |
| `media/academic/` | Academic project covers and original project PDFs |
| `media/professional/` | Documentary thumbnails and episode card images |
| `media/creative/` | Photography, AI visuals, campaign/collection imagery, video thumbnails and optionally videos |

The website currently uses deliberately abstract CSS placeholders where Amit's real images, PDFs and video links haven't yet been uploaded. **No invented project photographs or videos are included.**

### 1. Homepage rotating images

Upload images such as `media/home/hero-01.webp` and `hero-02.webp`; then update `site.hero_images`:

```json
"hero_images": [
  "media/home/hero-01.webp",
  "media/home/hero-02.webp"
]
```

A different image is selected on repeat visits when two or more are available; the site avoids showing the previously selected image twice in a row when possible. Hovering or focusing *Let's explore* lightens the overlay and subtly zooms the image.

### 2. Work category and project covers

Add a `cover` path to any category or project in `content/site.json`:

```json
"cover": "media/categories/academic.webp"
```

or

```json
"cover": "media/academic/apple-ring-cover.webp"
```

### 3. PDF on an academic project page

Upload your optimized PDF to `media/academic/`, then give the project a PDF path:

```json
"pdf": "media/academic/apple-ring-thesis.pdf"
```

The project page immediately displays the full PDF with browser-native PDF navigation and zoom, a fullscreen toggle and an *Open PDF* action. Native browser PDF controls differ between desktop browsers; on mobile, opening the PDF in a dedicated tab is often the better reading experience.

**Large file note:** GitHub blocks individual files greater than 100 MB. For larger PDFs, compress/optimize the file or host it on stable external storage, then put its full URL into `pdf`. Keep the file publicly accessible if the portfolio is public.

### 4. Episode buttons with dedicated player pages

For each documentary in `professional_projects`, add episode objects. Example:

```json
"episodes": [
  {
    "slug": "episode-one",
    "title": "The Episode's Actual Title",
    "subtitle": "Selected episode",
    "description": "An optional one-sentence episode introduction.",
    "cover": "media/professional/episode-one.webp",
    "video_url": "https://www.youtube.com/watch?v=VIDEO_ID"
  }
]
```

YouTube, YouTube Shorts, youtu.be, and Vimeo URLs are supported. The script converts valid links into privacy-conscious YouTube or Vimeo embeds. **Do not use example IDs; insert actual published links with embedding permission.**

### 5. Creative Explorations galleries

Creative Explorations uses **individual, mixed-media sets**, not categories. The initial *Set 01*–*Set 04* cards are changeable placeholders, each of which can contain any combination of photography, AI visuals, film, editing, and collection design. Give each set its own title, cover image and list of media. No work is fabricated.

For a collection in `creative_collections`, add media objects. Photos:

```json
"media": [
  {
    "type": "image",
    "src": "media/creative/photo-01.webp",
    "title": "Portrait Study"
  }
]
```

YouTube/Vimeo videos require a thumbnail:

```json
"media": [
  {
    "type": "video",
    "src": "https://vimeo.com/123456789",
    "thumbnail": "media/creative/film-cover.webp",
    "title": "Film Study"
  }
]
```

Local MP4 videos also work by setting `src` to `media/creative/your-video.mp4` and providing a `thumbnail` image. Visitors click any gallery tile to see the image or video fullscreen, with left/right keyboard navigation and Escape to close.

### 6. About & Contact

Contact information and homepage copy are in `site` at the beginning of `content/site.json`.

**Privacy:** The website intentionally uses the professional email and LinkedIn from the CV, but does **not** publish Amit's date of birth, mobile number or CV document. If you want the CV publicly downloadable, review/remove any private information first.

## GitHub: completely new repository

1. On GitHub, create a **new repository**, e.g. `amit-portfolio`. **Do not** select or make changes to `inbar-scout`.
2. Download/unzip this project into a local folder.
3. In Terminal, inside the project folder, run:

```bash
git init
git branch -M main
git add .
git commit -m "Build initial Amit portfolio website"
git remote add origin https://github.com/amitmayo/amit-portfolio.git
git push -u origin main
```

4. For **GitHub Pages**, go to repository **Settings → Pages → Build and deployment → Source: GitHub Actions**. The provided workflow builds and publishes automatically after each push.
5. For **Vercel**, create a **new project**, import this separate GitHub repository, and deploy. The included `vercel.json` builds the static `dist` directory. Use an independent Vercel project from Inbar Scout.

**Important:** Publishing through GitHub is not automated inside this ZIP. A new GitHub repo and hosting project must be created by the account owner.

## What remains before the website is content-complete

- Upload actual hero photographs / images and category thumbnails.
- Upload seven academic project covers and complete PDFs; refine the brief introductions if needed.
- Upload documentary episode thumbnails and provide actual YouTube/Vimeo links with permission to embed.
- Replace the *Set 01*–*Set 04* placeholder titles with names for your mixed-media sets; upload photos and videos into each set.
- Decide on your final personal domain, and check the appearance on a real phone.

Everything else, including layouts, routes, responsive design, hover interactions, placeholders and the media-viewing systems, is implemented.
