-- Blog schema for Advokatska kancelarija Vladić.
-- Categories drive the blog filters and the "Članci iz oblasti" blocks on
-- practice-area pages; only categories with published posts are listed publicly.

CREATE TABLE categories (
  slug        TEXT PRIMARY KEY CHECK (slug GLOB '[a-z0-9]*' AND slug NOT GLOB '*[^a-z0-9-]*'),
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE posts (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT NOT NULL UNIQUE CHECK (slug GLOB '[a-z0-9]*' AND slug NOT GLOB '*[^a-z0-9-]*'),
  title            TEXT NOT NULL,
  -- Short summary: featured-card excerpt, meta description and JSON-LD description.
  excerpt          TEXT NOT NULL,
  -- Optional <title> override; defaults to "<title> | Advokat Vladić".
  seo_title        TEXT,
  category_slug    TEXT NOT NULL REFERENCES categories(slug) ON UPDATE CASCADE,
  cover_url        TEXT,
  cover_alt        TEXT NOT NULL DEFAULT '',
  og_image_url     TEXT,
  body_md          TEXT NOT NULL,
  reading_minutes  INTEGER NOT NULL CHECK (reading_minutes > 0),
  published_at     TEXT NOT NULL CHECK (published_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  status           TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  created_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  updated_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Public listing: newest first, optionally per category.
CREATE INDEX posts_status_published_idx ON posts (status, published_at DESC, id DESC);
CREATE INDEX posts_category_published_idx ON posts (category_slug, status, published_at DESC, id DESC);
