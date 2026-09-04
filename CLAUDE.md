# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Jekyll static site for "The Candid Duo," a travel blog, deployed for free on GitHub Pages with Decap CMS (`/admin`) as an on-site editor and Google AdSense monetization. There is no local build/run step required for normal edits — GitHub Pages builds the site automatically on push to `main`. Content is Markdown/YAML; the CMS commits directly to the repo.

## Commands

No package.json/JS tooling — this is a plain Jekyll + Ruby site.

```bash
bundle install       # first time only, installs gems from Gemfile
bundle exec jekyll serve   # local preview at http://localhost:4000
```

There are no automated tests or linters in this repo. Verify changes by running `jekyll serve` and checking the page in a browser, or by inspecting the built `_site/` output.

## Architecture

**Content model (Jekyll collections/data driving the templates):**
- `_posts/` — blog posts (filename `YYYY-MM-DD-slug.md`). Front matter drives most layout logic: `category`, `destination` (must match one of Jeju/New Zealand/Tasmania/Umroh/Singapore/Other to link up with destination pages), `image`/`image_alt`, `dek`/`excerpt`, `tags`, `featured` (only one post should be `featured: true` — it becomes the homepage lead story).
- `_products/` — affiliate product recommendations (collection with `output: false` in `_config.yml`, so products have no individual pages — they only render as cards via `_includes/product-card.html` on the homepage and `/products/`). Front matter: `name`, `image`, `price`, `platform`, `country`, `category` (free text; also becomes a filter button on `/products/`, so reuse exact wording to group items), `url` (affiliate link), `blurb`, `featured`, `date`.
- `_data/homepage.yml` — hero carousel slides, the scrolling ticker (WATCH/LISTEN/READ), and the "Watch & Listen" media cards. Fully editable via CMS.
- `_data/navigation.yml` — top nav menu items.
- `destinations/*.md` — one page per destination (Jeju, New Zealand, Tasmania, Umroh), using `_layouts/category.html`, which pulls in `site.posts | where: "destination", page.destination`.
- Top-level pages (`about.md`, `contact.md`, `privacy.md`, `products.html`, `stories.html`) use `_layouts/page.html` or their own inline layout.

**Layouts (`_layouts/`) → Includes (`_includes/`) chain:**
- `default.html` is the base shell (head/header/footer) that everything else extends via `layout: default`.
- `home.html` (homepage) assembles hero, ticker, featured/latest stories, Watch & Listen, destinations grid, featured products, about teaser — all Liquid-driven from `site.posts`, `site.products`, and `site.data.homepage`.
- `post.html` renders an article, auto-inserts an in-article ad after the 3rd paragraph (if the article is long enough), shows prev/next nav, and a related-stories block filtered by same `destination` (falls back to any other posts if fewer than 3 matches). Also emits BlogPosting JSON-LD.
- `category.html` is the generic "posts filtered by destination" template used by `destinations/*.md`.
- Reusable pieces live in `_includes/`: `head.html` (fonts, CSS, SEO tag, conditional AdSense script loader, analytics), `header.html` (nav, reads `site.data.navigation.main`), `footer.html`, `hero.html`, `ticker.html`, `story-card.html`, `product-card.html`, `ad.html`.

**Ad slots (`_includes/ad.html`):** Ad units (`leaderboard`, `infeed`, `inarticle`) only render real AdSense `<ins>` markup when `site.adsense.enabled` is `true` AND `publisher_id` isn't the placeholder value; otherwise a visual placeholder is shown. When editing ad placement/behavior, this gating logic is the source of truth.

**Reading time:** Computed inline via Liquid (`content | number_of_words | divided_by: 200 | plus: 1`) wherever it's shown (post header, story cards, homepage lead), overridable per-post with a `read_time` front-matter field.

**Styling:** Single stylesheet `assets/css/main.css`. Design tokens (colors, fonts, spacing) are CSS custom properties in the `:root` block at the top — change the site's look by editing tokens there rather than hunting for hardcoded values.

**CMS (Decap CMS) — `admin/config.yml` + `admin/index.html`:** Defines editable collections (`posts`, `products`, `homepage`, `pages` [about/contact/privacy], `navigation`) with fields that map directly to the front matter/`_data` schema described above. If you add/rename a front-matter field used in templates, update the corresponding CMS field definition here too, or the CMS UI and the actual content shape will drift apart. The CMS authenticates via GitHub OAuth through a small Cloudflare Worker in `oauth-worker/worker.js` (`base_url` in `admin/config.yml` points at it); this is infrastructure the user deploys separately to Cloudflare, not part of the Jekyll build.

**`_config.yml`:** Central site settings — `url`/`baseurl` (must match the GitHub Pages URL), `adsense` block (enable/publisher ID/slot IDs), `social` links, `google_analytics`, and `exclude` (keeps docs/tooling files out of the Jekyll build).
