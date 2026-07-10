-- Migration: cv_project_impact
-- Adds per-project, per-locale "problem -> impact" content plus a visibility
-- toggle so the generated CV (/cv.pdf) can curate a subset of projects.
--
-- All columns are additive (nullable or defaulted): no existing row requires
-- backfill to remain valid, and /cv.pdf renders identically to its
-- pre-feature output until cv_visible is explicitly set to true.
--
-- MANUAL STEP: run this against prod (db.edsonpedraza.com) after the PR
-- that introduces this migration merges. No automated process runs it.
--
-- Rollback: drop the 5 columns below and revert the cv.pdf select/render
-- changes from the same change.

alter table projects
  add column if not exists cv_visible boolean not null default false,
  add column if not exists cv_problem_es text,
  add column if not exists cv_problem_en text,
  add column if not exists cv_impact_es jsonb,
  add column if not exists cv_impact_en jsonb;
