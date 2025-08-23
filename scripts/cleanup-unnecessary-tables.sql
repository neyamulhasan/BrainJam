-- Drop unnecessary rank_history table
-- This table is redundant since we can calculate ranks from rating_history efficiently

USE brain_jam;

-- Check if table exists and drop it
DROP TABLE IF EXISTS rank_history;

-- Verify the table is gone
SHOW TABLES LIKE 'rank_history';
