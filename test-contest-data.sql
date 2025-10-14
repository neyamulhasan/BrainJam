-- Sample contest data for testing "Enter Contest" functionality
-- Run this in your MySQL database to create test data

-- Insert a test contest (adjust times as needed)
INSERT INTO contests (title, description, start_time, end_time, duration_hours, created_by, created_at) 
VALUES (
    'Demo Contest - Enter Contest Test',
    'This is a demo contest to test the Enter Contest functionality. Try solving the problems!',
    DATE_ADD(NOW(), INTERVAL -1 HOUR),  -- Started 1 hour ago
    DATE_ADD(NOW(), INTERVAL 2 HOUR),   -- Ends in 2 hours  
    3,
    1,  -- Admin user ID
    NOW()
);

-- Get the contest ID (will be auto-generated)
SET @contest_id = LAST_INSERT_ID();

-- Add some problems to the contest (assuming problems with IDs 1,2,3 exist)
INSERT INTO contest_problems (contest_id, problem_id, display_order) VALUES
(@contest_id, 1, 1),
(@contest_id, 2, 2);

-- Register a test user for the contest (assuming user ID 1 exists)
INSERT INTO contest_participants (contest_id, user_id, registered_at) VALUES
(@contest_id, 1, NOW());

-- Display the created contest info
SELECT 
    c.id as contest_id,
    c.title,
    c.description,
    c.start_time,
    c.end_time,
    COUNT(cp.user_id) as participants
FROM contests c
LEFT JOIN contest_participants cp ON c.id = cp.contest_id
WHERE c.id = @contest_id
GROUP BY c.id;