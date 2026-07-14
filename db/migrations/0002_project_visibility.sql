-- Migration: project_visibility
-- Adds a public visibility toggle to projects. When is_visible = false, the
-- project is dropped from every PUBLIC listing (landing FlowingMenu, /proyectos
-- index, related-projects strip, sitemap). Admin queries are unfiltered so the
-- project stays manageable and can be published later by flipping the flag.
--
-- Additive and defaulted to true: the column addition preserves existing rows.
-- The explicit backfill below then hides rows with no localized approach body.
--
-- MANUAL STEP: run this against prod (db.edsonpedraza.com) after the change
-- merges. No automated process runs it. Reload PostgREST's schema cache after:
--   NOTIFY pgrst, 'reload schema';
--
-- Rollback: `alter table projects drop column is_visible;` and revert the
-- `.eq('is_visible', true)` filters added in the same change.

alter table projects
  add column if not exists is_visible boolean not null default true;

-- Hide the projects that have no case study yet (approach_body empty).
update projects
set is_visible = false
where coalesce(nullif(trim(approach_body_es), ''), nullif(trim(approach_body_en), '')) is null;
