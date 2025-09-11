-- Script to delete all data from grid search tables
-- Run these commands in order to clear all grid search data

-- Delete from tables with foreign key dependencies first
DELETE FROM grid_point_results;
DELETE FROM grid_competitors;
DELETE FROM competitor_summaries;
DELETE FROM grid_cells;
DELETE FROM grid_searches;

-- Verify tables are empty
SELECT 'grid_searches' as table_name, COUNT(*) as row_count FROM grid_searches
UNION ALL
SELECT 'grid_competitors' as table_name, COUNT(*) as row_count FROM grid_competitors
UNION ALL
SELECT 'grid_point_results' as table_name, COUNT(*) as row_count FROM grid_point_results
UNION ALL
SELECT 'grid_cells' as table_name, COUNT(*) as row_count FROM grid_cells
UNION ALL
SELECT 'competitor_summaries' as table_name, COUNT(*) as row_count FROM competitor_summaries;