#!/usr/bin/env python3
"""Build Amit Dahan Mayo's dependency-free static portfolio.

Edit content/site.json, add files to media/, then run: python3 build.py
SITE_BASE_PATH=/my-repository python3 build.py for GitHub Pages project sites.
"""
from __future__ import annotations
import html
import json
import os
import re
import shutil
from pathlib import Path
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "dist"
CONFIG = json.loads((ROOT / "content/site.json").read_text(encoding="utf-8"))
SITE = CONFIG["site"]
BASE = os.environ.get("SITE_BASE_PATH", "").rstrip("/")
if BASE and not BASE.startswith("/"):
    BASE = "/" + BASE


def e(value: object) -> str:
    return html.escape(str(value), quote=True)


def uri(path: str = "") -> str:
    path = path.strip("/")
    return (BASE + "/" + path) if path else (BASE + "/")


def media_uri(path: str) -> str:
    if not path:
        return ""
    if path.startswith(("https://", "http://")):
        return path
    return uri(path)


def has_media(path: str) -> bool:
    return bool(path) and (path.startswith(("https://", "http://")) or (ROOT / path.lstrip("/")).is_file())


def icon(name: str, size: int = 18) -> str:
    shapes = {
        "arrow": '<path d="M5 12h14M12 5l7 7-7 7"/>',
        "arrow-up": '<path d="m7 17 10-10M8 7h9v9"/>',
        "left": '<path d="M19 12H5m7 7-7-7 7-7"/>',
        "file": '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
        "expand": '<path d="M8 3H5a2 2 0 0 0-2 2v3m13-5h3a2 2 0 0 1 2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-5v3a2 2 0 0 1-2 2h-3"/>',
        "external": '<path d="M14 3h7v7m-11 4L21 3M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/>',
        "menu": '<path d="M3 7h18M3 12h18M3 17h18"/>',
        "close": '<path d="M18 6 6 18M6 6l12 12"/>',
        "next": '<path d="m9 18 6-6-6-6"/>',
        "prev": '<path d="m15 18-6-6 6-6"/>',
        "play": '<circle cx="12" cy="12" r="10"/><path d="m10 8 6 4-6 4z"/>',
        "image": '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
    }
    return f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{shapes[name]}</svg>'


def nav(active: str, fixed: bool = True) -> str:
    links = [("work", "Work", "work/"), ("about", "About", "about/"), ("contact", "Contact", "contact/")]
    items = "".join(f'<a href="{uri(link)}" {"aria-current=page" if active == key else ""}>{label}</a>' for key, label, link in links)
    return f'''<header class="site-header {'fixed' if fixed else ''}">
      <a class="brand" href="{uri()}"><span class="brand-icon"></span>AMIT DAHAN MAYO</a>
      <button class="mobile-menu-button" type="button" aria-label="Open navigation" aria-expanded="false" aria-controls="site-nav" data-menu-toggle>{icon('menu')}</button>
      <nav class="site-nav" id="site-nav" aria-label="Main navigation">{items}</nav>
    </header>'''


def education_notice() -> str:
    return '<p class="education-notice">'+e('Academic projects displayed here were created for educational and portfolio purposes only. Third-party names, logos, imagery and other materials remain the property of their respective owners. No commercial use, affiliation or endorsement is intended.')+'</p>'


def footer() -> str:
    return f'''<footer class="site-footer page-shell">
      <span>© {os.environ.get('COPYRIGHT_YEAR', '2026')} AMIT DAHAN MAYO</span>

      <div class="site-footer-right"><a href="{e(SITE['linkedin'])}" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="mailto:{e(SITE['email'])}">Email</a></div>
    </footer>'''


def page(title: str, description: str, body: str, *, active: str = "", homepage: bool = False, extra_script: str = "") -> str:
    file_title = f"{title} — {SITE['name']}" if title != SITE['name'] else SITE['name']
    return f'''<!doctype html>
<html lang="en" data-site-base="{e(BASE)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark"><meta name="theme-color" content="#171719">
<meta name="description" content="{e(description)}"><title>{e(file_title)}</title>
<link rel="icon" href="{uri('assets/favicon.svg')}" type="image/svg+xml">
<script>
/* Hold the old static fallback out of sight until published content is ready. */
(() => {{
  const root=document.documentElement;
  root.classList.add('portfolio-booting');
  let complete=false;
  window.PortfolioBoot={{
    isReady:()=>complete,
    finish:()=>{{
      if(complete)return false;
      complete=true;
      root.classList.remove('portfolio-booting');
      root.classList.add('portfolio-booted');
      document.dispatchEvent(new Event('portfolio:booted'));
      return true;
    }}
  }};
  /* Website remains usable without a working backend, even if a script fails. */
  setTimeout(()=>window.PortfolioBoot.finish(),3200);
}})();
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Newsreader:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{uri('assets/style.css')}">
<meta property="og:title" content="{e(file_title)}"><meta property="og:description" content="{e(description)}"><meta property="og:type" content="website">
</head><body>
<a class="skip-link" href="#main">Skip to content</a>
{nav(active, fixed=True) if not homepage else ""}
<main id="main">{body}</main>
{footer() if not homepage else ''}
{extra_script}
<script src="{uri('assets/hero-format.js')}" defer></script>
<script src="{uri('assets/app.js')}" defer></script>
<script src="{uri('assets/live.js')}" defer></script>
<script src="{uri('assets/analytics.js')}" defer></script>
</body></html>'''


def write(route: str, output: str) -> None:
    destination = OUTPUT / route / "index.html" if route else OUTPUT / "index.html"
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(output, encoding="utf-8")


def breadcrumbs(steps: list[tuple[str, str | None]]) -> str:
    chunks = [f'<a href="{uri()}">Home</a>']
    for name, path in steps:
        chunks.append('<span class="sep">/</span>')
        chunks.append(f'<a href="{uri(path)}">{e(name)}</a>' if path is not None else f'<span>{e(name)}</span>')
    return '<nav aria-label="Breadcrumb" class="breadcrumbs">' + ''.join(chunks) + '</nav>'


def art_style(info: dict) -> str:
    path = info.get("cover", "")
    if not has_media(path): return ''
    x = max(0,min(100,float(info.get('coverPositionX', 50))))
    y = max(0,min(100,float(info.get('coverPositionY', 50))))
    zoom = max(1,min(2.5,float(info.get('coverZoom', 1))))
    return f' style="background-image:url(&quot;{e(media_uri(path))}&quot;);background-position:{x}% {y}%;--media-zoom:{zoom}"' 


def card(info: dict, target: str, counter: str, *, compact: bool = False, wide: bool = False) -> str:
    tone = re.sub(r"[^a-z]", "", str(info.get("tone", "clay")))
    return f'''<a class="visual-card {'small' if compact else ''} {'wide' if wide else ''}" href="{uri(target)}" aria-label="Explore {e(info['title'])}">
      <div class="visual-card-image tone-{tone}"{art_style(info)}></div><div class="visual-card-shape"></div><div class="visual-card-shade"></div>
      <div class="visual-card-content"><div class="tile-top"><span class="tile-index">{e(counter)}</span><span class="tile-icon">{icon('arrow-up')}</span></div>
        <div class="tile-bottom"><h2 class="tile-title {'smaller' if compact else ''}">{e(info['title'])}</h2><p class="tile-subtitle">{e(info.get('subtitle', ''))}</p></div>
      </div></a>'''


def intro(label: str, heading: str, description: str = "", *, smaller: bool = False) -> str:
    return f'''<section class="page-intro reveal"><p class="eyebrow">{e(label)}</p><h1 class="display-title {'small' if smaller else ''}">{heading}</h1>
    {f'<p class="lead">{e(description)}</p>' if description else ''}</section>'''


def section_intro(key: str, *, smaller: bool = False) -> str:
    """Editable page introduction with the original ivory + burgundy emphasis."""
    defaults = {
        "work": {"eyebrow": "The portfolio", "heading": "A little bit of", "accent": "everything.", "description": "Some things started as an idea on paper. Others found their way onto a screen. Here is a little of both."},
        "academic": {"eyebrow": "01 / Academic Work", "heading": "A few years of", "accent": "ideas."},
        "professional": {"eyebrow": "02 / Professional Work", "heading": "Behind the", "accent": "story.", "description": "Selected documentary productions and the work behind bringing them to the screen."},
        "creative": {"eyebrow": "03 / Creative Explorations", "heading": "Less talking.", "accent": "More looking.", "description": "An assortment of images, videos, experiments, and things I felt like making — each set is its own little mix."}
    }
    cfg = {**defaults[key], **CONFIG.get("section_intros", {}).get(key, {})}
    heading = e(cfg.get("heading") or "")
    if cfg.get("accent"):
        heading += " <em>" + e(cfg["accent"]) + "</em>"
    description = CONFIG.get("academic_intro", "") if key == "academic" else cfg.get("description", "")
    return intro(cfg.get("eyebrow") or "", heading, description, smaller=smaller)


def list_head(label: str, count: int | str) -> str:
    return f'<div class="section-topline"><span class="small-label">{e(label)}</span><span class="count-label">{e(count)}</span></div>'


def back(text: str, target: str) -> str:
    return f'<div class="back-row"><a class="back-link" href="{uri(target)}">{icon("left")} {e(text)}</a></div>'


def home() -> None:
    images = [{**entry,'src':media_uri(entry['src'])} if isinstance(entry,dict) else {'src':media_uri(entry)} for entry in SITE.get('hero_images',[]) if has_media(entry.get('src','') if isinstance(entry,dict) else entry)]
    script_json = json.dumps(images, ensure_ascii=False).replace("<", "\\u003c")
    body = f'''<section class="hero" aria-label="Introduction" data-hover-effect="burgundy-veil">
      <div class="hero-background" data-hero-background></div><div class="hero-overlay"></div><div class="hero-texture"></div>
      <div class="hero-inner"><div class="hero-copy reveal">
      <h1 class="hero-title" aria-label="hey you.">hey <em>you.</em></h1><p class="hero-intro">{e(SITE['hero_intro'])}</p>
      <a class="explore-button" href="{uri('work/')}" data-hero-reveal><span class="explore-label">{e(SITE['homepage_button'])}</span><span class="minimal-arrow">{icon('arrow', 14)}</span></a>
      </div></div></section>'''
    write("", page(SITE["name"], "Creative projects and selected professional work by Amit Dahan Mayo.", body, homepage=True, extra_script=f'<script>window.PORTFOLIO_HERO_IMAGES={script_json};</script>'))


def work() -> None:
    sections = CONFIG["categories"]
    targets = {"academic": "work/academic/", "professional": "work/professional/", "creative": "work/creative-explorations/"}
    cards = ''.join(card(sections[key], targets[key], f"0{i} / 03", compact=True) for i, key in enumerate(("academic", "professional", "creative"), 1))
    body = f'''<div class="page-shell content-frame">{section_intro('work')}
        {list_head('Find your way through', '03 categories')}<div class="tile-grid three">{cards}</div>{education_notice()}</div>'''
    write("work", page("Work", "Explore Amit's academic work, professional productions, and creative experiments.", body, active="work"))


def academic() -> None:
    projects = CONFIG["academic_projects"]
    cards = ''.join(card(p, f"work/academic/{p['slug']}/", f"{i:02d} / {len(projects):02d}") for i, p in enumerate(projects, 1))
    body = f'''<div class="page-shell content-frame">{breadcrumbs([('Work', 'work/'), ('Academic Work', None)])}
    {section_intro('academic', smaller=True)}
    {list_head('Selected projects', f'{len(projects):02d} projects')}<div class="tile-grid">{cards}</div>{education_notice()}{back('Back to Work', 'work/')}</div>'''
    write("work/academic", page("Academic Work", "Selected academic projects from Istituto Marangoni Milano by Amit Dahan Mayo.", body, active="work"))


def pdf_embed_link(path: str) -> tuple[str, str]:
    from urllib.parse import parse_qs, urlparse
    source=media_uri(path)
    u=urlparse(source)
    if u.hostname in ('drive.google.com','www.drive.google.com'):
        m=re.search(r'/file/d/([a-zA-Z0-9_-]{15,})',u.path)
        identifier=m.group(1) if m else parse_qs(u.query).get('id',[''])[0]
        if re.fullmatch(r'[a-zA-Z0-9_-]{15,}',identifier):
            return f'https://drive.google.com/file/d/{identifier}/preview', f'https://drive.google.com/file/d/{identifier}/view'
    return source+'#toolbar=1&navpanes=0',source


def pdf_viewer(info: dict) -> str:
    records = info.get('pdfs') if isinstance(info.get('pdfs'), list) else ([{'title': 'Project document', 'url': info.get('pdf', '')}] if info.get('pdf') else [])
    documents = []
    for index, record in enumerate(records):
        source = record.get('url', record.get('src', ''))
        if not has_media(source):
            continue
        embed, raw = pdf_embed_link(source)
        documents.append((record.get('title', f'Document {index + 1}'), embed, raw))
    if documents:
        title, embed, raw = documents[0]
        content = (f'<div class="pdf-viewport"><iframe data-live-pdf-frame title="{e(info["title"])} — {e(title)}" src="{e(embed)}" loading="eager"></iframe></div>'
                   f'<div class="pdf-mobile-panel"><span class="pdf-mobile-title" data-live-pdf-mobile-title>{e(title)}</span>'
                   f'<p>For the complete document, open the PDF in your phone’s PDF viewer. You can zoom and browse all pages there.</p>'
                   f'<a class="pdf-mobile-button" data-live-pdf-mobile-open href="{e(raw)}" target="_blank" rel="noopener noreferrer">View selected PDF ↗</a></div>')
        actions = f'<a data-live-pdf-open href="{e(raw)}" target="_blank" rel="noopener noreferrer">{icon("external")}<span class="label">Open PDF</span></a><button type="button" data-pdf-fullscreen aria-label="Fullscreen PDF">{icon("expand")}<span class="label">Fullscreen</span></button>'
        chooser = ''
        if len(documents) > 1:
            chooser = '<div class="pdf-switcher" aria-label="Choose a project document">' + ''.join(
                f'<button type="button" class="pdf-switch {"active" if n == 0 else ""}" data-live-pdf-select data-pdf-embed="{e(url)}" data-pdf-open="{e(download)}" data-pdf-title="{e(label)}" aria-pressed="{str(n == 0).lower()}">{e(label)}</button>'
                for n, (label, url, download) in enumerate(documents)
            ) + '</div>'
    else:
        content = f'<div class="pdf-empty">{icon("file",43)}<strong>Full project coming soon</strong><p>PDFs will appear here once added to the portfolio.</p></div>'
        actions = chooser = ''
    return f'<section aria-label="Project PDF" class="pdf-block" id="project-pdf"><div class="pdf-bar"><div class="pdf-bar-left">{icon("file")}<span>Project documents</span></div><div class="pdf-actions">{actions}</div></div>{chooser}{content}</section>'


def academic_project(info: dict) -> None:
    cover = f'''<div class="project-hero-cover"><div class="visual-card-image tone-{e(info.get('tone','clay'))}"{art_style(info)}></div><div class="visual-card-shape"></div><div class="visual-card-shade"></div><span class="cover-label">{e(info['subtitle'])}</span></div>'''
    body = f'''<div class="page-shell content-frame">{breadcrumbs([('Work', 'work/'), ('Academic Work', 'work/academic/'), (info['title'], None)])}
      {cover}<div class="project-detail-head reveal"><p class="eyebrow">{e(info['subtitle'])}</p><h1 class="display-title small">{e(info['title'])}</h1>
      <p class="project-description">{e(info['description'])}</p></div>{pdf_viewer(info)}{education_notice()}{back('All academic projects', 'work/academic/')}</div>'''
    write(f"work/academic/{info['slug']}", page(info["title"], info["description"], body, active="work"))


def professional() -> None:
    pro = CONFIG["professional_projects"]
    cards = ''.join(card(p, f"work/professional/{p['slug']}/", f"{i:02d} / {len(pro):02d}", wide=True) for i,p in enumerate(pro,1))
    body = f'''<div class="page-shell content-frame">{breadcrumbs([('Work', 'work/'), ('Professional Work', None)])}
    {section_intro('professional', smaller=True)}
    {list_head('Selected productions', f'{len(pro):02d} productions')}<div class="tile-grid">{cards}</div>{back('Back to Work', 'work/')}</div>'''
    write("work/professional", page("Professional Work", "Selected documentary productions by Amit Dahan Mayo.", body, active="work"))


def episode_url(url: str) -> str:
    if not url:
        return ""
    parsed = urlparse(url)
    hostname = (parsed.hostname or "").lower()
    if hostname in {"www.youtube.com", "youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"}:
        candidate = parse_qs(parsed.query).get("v", [""])[0] if parsed.path == "/watch" else (parsed.path.strip("/").split("/")[-1] if parsed.path.startswith(("/embed/", "/shorts/", "/live/")) else "")
        if re.fullmatch(r"[\w-]{11}", candidate):
            return f"https://www.youtube-nocookie.com/embed/{candidate}?rel=0"
    if hostname in {"youtu.be", "www.youtu.be"}:
        candidate = parsed.path.strip("/").split("/")[0]
        if re.fullmatch(r"[\w-]{11}", candidate):
            return f"https://www.youtube-nocookie.com/embed/{candidate}?rel=0"
    if hostname in {"vimeo.com", "www.vimeo.com", "player.vimeo.com"}:
        match = re.search(r"(?:/video)?/(\d+)", parsed.path)
        if match:
            return f"https://player.vimeo.com/video/{match.group(1)}"
    if hostname in {"drive.google.com", "www.drive.google.com"}:
        match = re.search(r"/file/d/([a-zA-Z0-9_-]{15,})", parsed.path)
        identifier = match.group(1) if match else parse_qs(parsed.query).get('id', [''])[0]
        if re.fullmatch(r"[a-zA-Z0-9_-]{15,}", identifier):
            return f"https://drive.google.com/file/d/{identifier}/preview"
    return ""


def professional_project(info: dict) -> None:
    episodes = info.get('episodes', [])
    tiles = []
    for i, ep in enumerate(episodes, 1):
        item = {**ep, 'tone': ep.get('tone',info.get('tone','cobalt')), 'subtitle': ep.get('subtitle','Watch episode')}
        tiles.append(card(item, f"work/professional/{info['slug']}/{ep['slug']}/", f"{i:02d} / {len(episodes):02d}", compact=True))
    if not tiles:
        tiles = [f'''<div class="episode-placeholder" aria-label="Future episode card">{icon('play', 27)}<div><p class="eyebrow muted">Selected episodes</p><strong>Episodes coming soon.</strong><p style="font-size:13px;margin-top:6px">Images and video links can be added later.</p></div></div>''']
    body = f'''<div class="page-shell content-frame">{breadcrumbs([('Work','work/'),('Professional Work','work/professional/'),(info['title'],None)])}
      <section class="page-intro reveal" style="padding-bottom:65px"><p class="eyebrow">{e(info['subtitle'])}</p><h1 class="display-title small">{e(info['title'])}</h1>
      <p class="lead compact">{e(info['description'])}</p></section>
      <section class="project-summary" aria-label="My contribution"><div><p class="eyebrow">My contribution</p></div><div class="role-detail"><span class="role-label">Role</span><div><h3>{e(info['role'])}</h3><p>{e(info['responsibilities'])}</p></div></div></section>
      {list_head('Selected episodes', f'{len(episodes):02d} episodes')}<div class="tile-grid episode-grid">{''.join(tiles)}</div>{back('All professional work','work/professional/')}</div>'''
    write(f"work/professional/{info['slug']}", page(info["title"], info["description"], body, active="work"))
    for ep in episodes:
        professional_episode(info, ep)


def professional_episode(show: dict, ep: dict) -> None:
    embed = episode_url(ep.get('video_url', ''))
    if embed:
        player = f'<iframe src="{e(embed)}" title="{e(ep["title"])}" loading="lazy" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>'
    else:
        url = ep.get('video_url', '')
        parsed = urlparse(url)
        if parsed.scheme == 'https' and parsed.netloc:
            kan = parsed.hostname == 'kan.org.il' or (parsed.hostname or '').endswith('.kan.org.il')
            label = 'Watch on KAN 11' if kan else 'Watch on the original website'
            player = f'<div class="video-placeholder external-episode"><p>This episode is available from its original publisher.</p><a class="official-watch-link" href="{e(url)}" target="_blank" rel="noopener noreferrer">{label} ↗</a><p class="external-episode-note">Opens the official page in a new tab.</p></div>'
        else:
            player = f'<div class="video-placeholder"><p>Add a YouTube, Vimeo, Google Drive or broadcaster link to this episode.</p></div>'
    summary = e(ep.get('description','Selected episode from ' + show['title'] + '.'))
    body = f'''<div class="page-shell content-frame">{breadcrumbs([('Work','work/'),('Professional Work','work/professional/'),(show['title'],f"work/professional/{show['slug']}/"),(ep['title'],None)])}
      {intro(show['title'],e(ep['title']),summary,smaller=True)}<section class="video-embed" aria-label="Episode player">{player}</section>{back('Back to episodes',f"work/professional/{show['slug']}/")}</div>'''
    write(f"work/professional/{show['slug']}/{ep['slug']}", page(ep['title'], ep.get('description',show['title']), body, active="work"))


def creative() -> None:
    collections = CONFIG['creative_collections']
    cards = ''.join(card({**coll, 'cover': coll.get('cover') or next((m.get('src') for m in coll.get('media',[]) if m.get('type') != 'video' and m.get('src')), '') or next((m.get('thumbnail') for m in coll.get('media',[]) if m.get('thumbnail')), '')},f"work/creative-explorations/{coll['slug']}/",f"{i:02d} / {len(collections):02d}").replace('class="visual-card','data-live-open-set="'+e(coll['slug'])+'" class="visual-card') for i,coll in enumerate(collections,1))
    body = f'''<div class="page-shell content-frame">{breadcrumbs([('Work','work/'),('Creative Explorations',None)])}
      {section_intro('creative', smaller=True)}
      {list_head('Browse the sets',f'{len(collections):02d} sets')}<div class="tile-grid">{cards}</div>{back('Back to Work','work/')}</div>'''
    write('work/creative-explorations',page('Creative Explorations','Photography, AI visuals, film, editing and design explorations by Amit Dahan Mayo.',body,active='work'))


def creative_collection(coll: dict) -> None:
    media = coll.get('media',[])
    tiles = []
    for i, item in enumerate(media):
        source = item.get('src', '')
        if not has_media(source):
            continue
        kind = item.get('type') if item.get('type') in ('pdf','video') else 'image'
        thumbnail = item.get('thumbnail', source if kind == 'image' else '')
        src = (episode_url(source) or media_uri(source)) if kind == 'video' else media_uri(source)
        title = item.get('title', f'Visual {i+1}')
        image = f'<img src="{e(media_uri(thumbnail))}" alt="{e(title)}" loading="lazy">' if has_media(thumbnail) else '<div class="gallery-document-cover"><span>'+ ('PDF' if kind=='pdf' else 'VIDEO') +'</span></div>'
        marker = '<span class="document-marker">PDF</span>' if kind=='pdf' else ('<span class="play-marker">▶</span>' if kind=='video' else '')
        tiles.append(f'<button type="button" class="gallery-item" data-live-gallery-item data-kind="{kind}" data-src="{e(src)}" data-caption="{e(title)}" aria-label="Open {e(title)}">{image}{marker}<span class="gallery-caption">{e(title)}</span></button>')
    if not tiles:
        gallery = '''<div class="placeholder-panel"><p class="eyebrow">A work in progress</p><h2>More to show soon.</h2><p>This set will hold a mix of images and videos once they've been added.</p></div>'''
    else:
        gallery = f'<div class="gallery-grid" data-gallery>{"".join(tiles)}</div>'
    body = f'''<div class="page-shell content-frame">{breadcrumbs([('Work','work/'),('Creative Explorations','work/creative-explorations/'),(coll['title'],None)])}
      {intro('Creative Explorations',e(coll['title']),coll.get('subtitle',''),smaller=True)}{gallery}{back('All creative sets','work/creative-explorations/')}</div>'''
    write(f"work/creative-explorations/{coll['slug']}", page(coll['title'],coll.get('subtitle','Creative visual collection'),body,active='work'))


def about() -> None:
    body = f'''<div class="page-shell content-frame">{intro('A little introduction', 'Hello, I\'m <em>Amit.</em>', 'A creative-minded person with a soft spot for good ideas, good design, and figuring out how to make them happen.')}
    <div class="about-grid"><div class="about-copy">
      <p>I like working somewhere between strategy and making — where a clear idea can become a campaign, an experience, an image, or something completely different.</p>
      <p>My background combines fashion management, marketing, communication and media with hands-on experience in television production. I care about the thinking behind the work just as much as how it looks and feels.</p>
      <p>After three years studying in Milan, I'm now based in Prague and always curious about what comes next.</p></div>
      <aside class="about-side"><dl class="fact"><dt>Based in</dt><dd>Prague, Czechia</dd></dl><dl class="fact"><dt>Education</dt><dd>BA in Fashion Management, Communication and Media<br>Istituto Marangoni Milano · 110/110</dd></dl>
      <dl class="fact"><dt>Interests</dt><dd>Brand strategy, creative direction, marketing, visual design, media and innovation</dd></dl>
      <dl class="fact"><dt>Languages</dt><dd>Hebrew · English</dd></dl></aside></div>
    <section class="timeline"><h2>Some chapters so far</h2>
      <div class="timeline-entry"><time>2026 — present</time><div><h3>Student Recruitment & Admissions Representative</h3><p>Istituto Marangoni · Prague</p></div></div>
      <div class="timeline-entry"><time>2023 — 2026</time><div><h3>Fashion Management, Communication and Media</h3><p>Istituto Marangoni · Milan · Graduated 110/110</p></div></div>
      <div class="timeline-entry"><time>2021 — 2023</time><div><h3>Post-Production Manager — Zman Emet</h3><p>KAN 11 · Tel Aviv</p></div></div>
      <div class="timeline-entry"><time>2023</time><div><h3>Post-Production Supervisor — Tiberias: Under the Red Line</h3><p>KAN 11 · Tel Aviv</p></div></div>
      <div class="timeline-entry"><time>2018 — 2021</time><div><h3>Post-Production Manager — Unit 339</h3><p>IAF · Israel</p></div></div>
    </section>{back('Explore my work','work/')}</div>'''
    write('about',page('About','Meet Amit Dahan Mayo — a multidisciplinary creative working across strategy, design, marketing and media.',body,active='about'))


def contact() -> None:
    body=f'''<div class="page-shell content-frame">{intro('Get in touch', 'Let\'s make <em>something.</em>')}
    <p class="contact-lead">Have a question, an idea, or just want to say hello? My inbox is open.</p>
    <a class="contact-email" href="mailto:{e(SITE['email'])}">{e(SITE['email'])}</a>
    <div class="contact-links"><a class="text-link" href="{e(SITE['linkedin'])}" target="_blank" rel="noopener noreferrer">Find me on LinkedIn ↗</a><span class="small-label">Based in Prague, Czechia</span></div>
    </div>'''
    write('contact',page('Contact','Get in touch with Amit Dahan Mayo.',body,active='contact'))


def admin_page() -> None:
    """Discreet owner-only portfolio editing entry point."""
    html_page = f'''<!doctype html><html lang="en" data-site-base="{e(BASE)}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow,noarchive"><meta name="theme-color" content="#171719">
<title>Portfolio Studio</title><link rel="icon" href="{uri('assets/favicon.svg')}" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Newsreader:wght@300;400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{uri('assets/style.css')}"><link rel="stylesheet" href="{uri('assets/admin.css')}"><link rel="stylesheet" href="{uri('assets/cv-studio.css')}">
</head><body class="portfolio-admin"><main id="admin-root">
<section class="admin-login" id="admin-login"><div class="login-inner">
<p class="admin-kicker">AMIT DAHAN MAYO / PORTFOLIO STUDIO</p>
<h1>Welcome back.</h1><p class="admin-hint">Sign in to edit your portfolio.</p>
<form id="admin-login-form"><label>Email<input name="email" type="email" autocomplete="username" required></label>
<label>Password<input name="password" type="password" autocomplete="current-password" required></label>
<button class="admin-primary" type="submit">Sign in <span aria-hidden="true">↗</span></button></form>
<p id="admin-login-error" role="alert" class="admin-error" hidden></p>
<p id="admin-setup" class="admin-hint" hidden>The portfolio backend has not been connected yet. Follow the setup instructions in the project README.</p>
<a href="{uri()}">← Back to portfolio</a></div></section>
<section class="admin-shell" id="admin-shell" hidden>
<header class="admin-topbar"><div><strong>AMIT DAHAN MAYO</strong><span>/ PORTFOLIO STUDIO</span></div>
<div class="admin-actions"><span id="admin-status" role="status">Draft loaded</span>
<button type="button" id="admin-save">Save draft</button><button type="button" class="admin-primary" id="admin-publish">Publish changes</button>
<button type="button" id="admin-signout">Log out</button></div></header>
<div class="admin-workspace"><section class="admin-preview-area" aria-label="Live website preview">
<div class="admin-preview-top"><span>WEBSITE PREVIEW</span><button id="admin-open-live" type="button">Open public website ↗</button></div>
<iframe id="admin-preview" title="Your portfolio website preview" src="{uri()}?portfolio_preview=1"></iframe><div id="cv-preview-root" class="cv-preview-root" hidden></div></section>
<aside class="admin-editor" aria-label="Content editor"><div class="admin-editor-top"><h2>Edit portfolio</h2><p>Changes are private until you publish.</p></div>
<div class="admin-section-tabs" id="admin-section-tabs"></div><div class="admin-editor-fields" id="admin-editor-fields"></div></aside></div>
</section></main>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="{uri('assets/hero-format.js')}" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" defer></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js" defer></script>
<script src="{uri('assets/cv-studio.js')}" defer></script>
<script src="{uri('assets/admin.js')}" defer></script></body></html>'''
    write('dan', html_page)


def dynamic_page(route: str, page_title: str, page_description: str) -> None:
    """Stable page URLs for projects created later in the CMS (no rebuild needed)."""
    content = f'<div class="page-shell content-frame"><div class="page-intro"><p class="eyebrow">Portfolio</p><h1 class="display-title small">{e(page_title)}</h1><p class="lead">Loading project…</p></div></div>'
    write(route, page(page_title, page_description, content, active='work'))


def not_found() -> None:
    body=f'''<div class="page-shell content-frame">{intro('404 / Not found','Lost your <em>way?</em>',"This page doesn't seem to exist. Let's get you back somewhere good.")}{back('Go home','')}</div>'''
    (OUTPUT/'404.html').write_text(page('Page not found','Page not found',body),encoding='utf-8')


def main() -> None:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()
    shutil.copytree(ROOT/'assets', OUTPUT/'assets')
    shutil.copytree(ROOT/'media', OUTPUT/'media')
    (OUTPUT/'assets'/'backend.json').write_text((ROOT/'config'/'backend.json').read_text(encoding='utf-8'),encoding='utf-8')
    (OUTPUT/'assets'/'initial-content.json').write_text((ROOT/'content'/'site.json').read_text(encoding='utf-8'),encoding='utf-8')
    home();work();academic();professional();creative();about();contact();admin_page()
    for route,title in (('work/academic/project','Academic Project'),('work/professional/show','Professional Project'),('work/professional/episode','Selected Episode'),('work/creative-explorations/set','Creative Exploration')):
        dynamic_page(route, title, 'Selected work by Amit Dahan Mayo.')
    for info in CONFIG['academic_projects']:
        academic_project(info)
    for info in CONFIG['professional_projects']:
        professional_project(info)
    for coll in CONFIG['creative_collections']:
        creative_collection(coll)
    not_found()
    files = list(OUTPUT.rglob('index.html'))
    print(f'Built {len(files)} pages → {OUTPUT}; base path {BASE or "/"}')


if __name__=='__main__':
    main()
