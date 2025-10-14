-- Insert test contest with ID 6 for demonstration
INSERT INTO contests (id, title, description, start_time, end_time, duration_hours, created_by, created_at) 
VALUES (
    6,
    'Live Coding Challenge #6',
    'A competitive programming contest featuring algorithm and data structure problems. Test your skills!',
    DATE_SUB(NOW(), INTERVAL 30 MINUTE),  -- Started 30 minutes ago
    DATE_ADD(NOW(), INTERVAL 90 MINUTE),  -- Ends in 90 minutes  
    2,
    1,  -- Admin user ID
    NOW()
) ON DUPLICATE KEY UPDATE
title = VALUES(title),
description = VALUES(description),
start_time = VALUES(start_time),
end_time = VALUES(end_time);

-- Add sample problems to contest 6
INSERT INTO contest_problems (contest_id, problem_id, display_order) VALUES
(6, 1, 1),
(6, 2, 2),
(6, 3, 3)
ON DUPLICATE KEY UPDATE display_order = VALUES(display_order);

-- Register test user for contest 6
INSERT INTO contest_participants (contest_id, user_id, registered_at) VALUES
(6, 1, NOW())
ON DUPLICATE KEY UPDATE registered_at = VALUES(registered_at);

-- Show contest info
SELECT 
    c.id,
    c.title,
    c.description,
    c.start_time,
    c.end_time,
    c.duration_hours,
    COUNT(DISTINCT cp.user_id) as participant_count,
    COUNT(DISTINCT cpp.problem_id) as problem_count
FROM contests c
LEFT JOIN contest_participants cp ON c.id = cp.contest_id
LEFT JOIN contest_problems cpp ON c.id = cpp.contest_id
WHERE c.id = 6
GROUP BY c.id;