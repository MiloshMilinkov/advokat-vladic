-- The 11 imported articles were seeded with the import time as created_at/updated_at,
-- which made every article look "modified" on the import day (sitemap lastmod and
-- BlogPosting dateModified). Reset them to their publish date. Only rows that were
-- never edited (created_at = updated_at) are touched.
UPDATE posts
SET created_at = published_at || 'T00:00:00Z',
    updated_at = published_at || 'T00:00:00Z'
WHERE created_at = updated_at
  AND slug IN (
    'neisplacena-zarada', 'ugovor-o-dozivotnom-izdrzavanju', 'ugovor-o-kupoprodaji-nepokretnosti',
    'upozorenje-pred-otkaz-ugovora-o-radu', 'nezakonit-otkaz', 'mobing-na-poslu', 'ujed-psa',
    'blokiran-racun-izvrsenje-u-srbiji', 'ugovor-o-poklonu', 'otkaz-ugovora-o-radu', 'razvod-braka'
  );
