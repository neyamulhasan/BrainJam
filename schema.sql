-- Brain Jam MySQL Schema + Sample Data
-- MySQL 8.0+, InnoDB, utf8mb4

CREATE DATABASE IF NOT EXISTS brain_jam
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE brain_jam;

SET NAMES utf8mb4;
SET sql_mode = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION';

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(32) NOT NULL UNIQUE,
  email VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  rating INT NOT NULL DEFAULT 800,
  rank_label ENUM('Private Recruit','Cadet Coder','Code Corporal','Tech Lieutenant','Algorithm Captain','Legendary General')
    NOT NULL DEFAULT 'Private Recruit',
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_stats (
  user_id INT PRIMARY KEY,
  solved_count INT NOT NULL DEFAULT 0,
  contest_count INT NOT NULL DEFAULT 0,
  win_count INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  last_active_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS friends (
  user_id INT NOT NULL,
  friend_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, friend_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- TAGS
CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- PROBLEMS
CREATE TABLE IF NOT EXISTS problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  body_md MEDIUMTEXT NOT NULL,
  input_format TEXT,
  output_format TEXT,
  constraints_md TEXT,
  difficulty ENUM('Easy','Medium','Hard') NOT NULL DEFAULT 'Easy',
  time_limit_ms INT NOT NULL DEFAULT 1000,
  memory_limit_kb INT NOT NULL DEFAULT 262144,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS problem_tags (
  problem_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (problem_id, tag_id),
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS problem_examples (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  example_order INT NOT NULL,
  input_text TEXT NOT NULL,
  output_text TEXT NOT NULL,
  explanation TEXT,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS test_cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  case_order INT NOT NULL,
  input_data TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  is_sample BOOLEAN NOT NULL DEFAULT FALSE,
  score_weight INT NOT NULL DEFAULT 1,
  visibility ENUM('hidden','sample') NOT NULL DEFAULT 'hidden',
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_test_cases_problem_order ON test_cases(problem_id, case_order);

-- LANGUAGES (Judge0 mapping)
CREATE TABLE IF NOT EXISTS languages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(64) NOT NULL,
  judge0_id INT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uq_judge0 (judge0_id)
) ENGINE=InnoDB;

-- CONTESTS
CREATE TABLE IF NOT EXISTS contests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  visibility ENUM('public','private','unlisted') NOT NULL DEFAULT 'public',
  access_code VARCHAR(32) UNIQUE,
  share_token VARCHAR(64) UNIQUE,
  is_virtual BOOLEAN NOT NULL DEFAULT FALSE,
  based_on_contest_id INT,
  rating_effect BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (based_on_contest_id) REFERENCES contests(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS contest_problems (
  contest_id INT NOT NULL,
  problem_id INT NOT NULL,
  display_order INT NOT NULL,
  points INT NOT NULL DEFAULT 100,
  PRIMARY KEY (contest_id, problem_id),
  FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB;
CREATE INDEX idx_contest_problems_order ON contest_problems(contest_id, display_order);

CREATE TABLE IF NOT EXISTS contest_participants (
  contest_id INT NOT NULL,
  user_id INT NOT NULL,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (contest_id, user_id),
  FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- SUBMISSIONS
CREATE TABLE IF NOT EXISTS submissions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  problem_id INT NOT NULL,
  contest_id INT NULL,
  language_id INT NOT NULL,
  source_code MEDIUMTEXT NOT NULL,
  stdin TEXT NULL,
  status ENUM('Pending','In Queue','Processing','Accepted','Wrong Answer','Compilation Error','Runtime Error','Time Limit Exceeded','Memory Limit Exceeded','Internal Error')
    NOT NULL DEFAULT 'Pending',
  score INT NOT NULL DEFAULT 0,
  execution_time_ms INT,
  memory_kb INT,
  judge0_token VARCHAR(64),
  verdict_details JSON,
  plagiarism_flag BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE SET NULL,
  FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE RESTRICT
) ENGINE=InnoDB;
CREATE INDEX idx_submissions_problem_user ON submissions(problem_id, user_id);
CREATE INDEX idx_submissions_contest_user ON submissions(contest_id, user_id);
CREATE INDEX idx_submissions_status ON submissions(status);

CREATE TABLE IF NOT EXISTS submission_case_results (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  submission_id BIGINT NOT NULL,
  test_case_id INT NOT NULL,
  status ENUM('Accepted','Wrong Answer','Runtime Error','Time Limit Exceeded','Memory Limit Exceeded','Skipped') NOT NULL,
  execution_time_ms INT,
  memory_kb INT,
  stdout TEXT,
  stderr TEXT,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (test_case_id) REFERENCES test_cases(id) ON DELETE CASCADE,
  UNIQUE KEY uq_submission_case (submission_id, test_case_id)
) ENGINE=InnoDB;

-- Difficulty votes (1..5)
CREATE TABLE IF NOT EXISTS problem_difficulty_votes (
  problem_id INT NOT NULL,
  user_id INT NOT NULL,
  score TINYINT NOT NULL CHECK (score BETWEEN 1 AND 5),
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (problem_id, user_id),
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Plagiarism findings (ensure app inserts with submission_id_a < submission_id_b)
CREATE TABLE IF NOT EXISTS plagiarism_findings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  submission_id_a BIGINT NOT NULL,
  submission_id_b BIGINT NOT NULL,
  similarity_percent DECIMAL(5,2) NOT NULL,
  method VARCHAR(32) DEFAULT 'local',
  flagged_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id_a) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (submission_id_b) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (flagged_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uq_pair (submission_id_a, submission_id_b)
) ENGINE=InnoDB;

-- Contest scores (materialized leaderboard)
CREATE TABLE IF NOT EXISTS contest_scores (
  contest_id INT NOT NULL,
  user_id INT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  penalty_seconds INT NOT NULL DEFAULT 0,
  rank INT,
  last_submission_at DATETIME,
  PRIMARY KEY (contest_id, user_id),
  FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Rating history
CREATE TABLE IF NOT EXISTS rating_history (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  contest_id INT NULL,
  rating_before INT NOT NULL,
  rating_after INT NOT NULL,
  delta INT NOT NULL,
  reason ENUM('contest','problem_solve','manual') NOT NULL DEFAULT 'contest',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (contest_id) REFERENCES contests(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Badges
CREATE TABLE IF NOT EXISTS badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_badges (
  user_id INT NOT NULL,
  badge_id INT NOT NULL,
  earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Daily random suggestion log
CREATE TABLE IF NOT EXISTS daily_suggestions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  problem_id INT NOT NULL,
  suggested_on DATE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_date (user_id, suggested_on)
) ENGINE=InnoDB;

-- Practice runs (non-competitive)
CREATE TABLE IF NOT EXISTS practice_runs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  problem_id INT NULL,
  language_id INT NULL,
  source_code MEDIUMTEXT,
  stdin TEXT,
  stdout TEXT,
  stderr TEXT,
  status ENUM('Accepted','Wrong Answer','Compilation Error','Runtime Error','Time Limit Exceeded','Memory Limit Exceeded','Internal Error'),
  execution_time_ms INT,
  memory_kb INT,
  judge0_token VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE SET NULL,
  FOREIGN KEY (language_id) REFERENCES languages(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- --------------------------------------------------
-- SAMPLE DATA
-- --------------------------------------------------

-- Users (password hash is a bcrypt placeholder for "password")
INSERT INTO users (username, email, password_hash, role, rating, rank_label, avatar_url) VALUES
('alice_admin','alice@example.com','$2b$10$CwTycUXWue0Thq9StjUM0uJ8h2dZQpime5FRCGDpa2BkLomqKgP/6','admin',1500,'Tech Lieutenant',NULL),
('bob','bob@example.com','$2b$10$CwTycUXWue0Thq9StjUM0uJ8h2dZQpime5FRCGDpa2BkLomqKgP/6','user',900,'Private Recruit',NULL),
('charlie','charlie@example.com','$2b$10$CwTycUXWue0Thq9StjUM0uJ8h2dZQpime5FRCGDpa2BkLomqKgP/6','user',1100,'Cadet Coder',NULL),
('diana','diana@example.com','$2b$10$CwTycUXWue0Thq9StjUM0uJ8h2dZQpime5FRCGDpa2BkLomqKgP/6','user',1250,'Code Corporal',NULL),
('eren','eren@example.com','$2b$10$CwTycUXWue0Thq9StjUM0uJ8h2dZQpime5FRCGDpa2BkLomqKgP/6','user',1400,'Tech Lieutenant',NULL);

INSERT INTO user_stats (user_id, solved_count, contest_count, win_count, streak_days)
VALUES (1, 200, 10, 3, 5), (2, 5, 1, 0, 1), (3, 20, 3, 1, 2), (4, 35, 4, 1, 0), (5, 60, 7, 2, 6);

-- Friends
INSERT INTO friends (user_id, friend_id) VALUES
(2,3),(3,2),
(2,4),(4,2);

-- Tags
INSERT INTO tags (name) VALUES ('dp'),('graphs'),('strings'),('math'),('greedy');

-- Languages (Verify judge0_id values with your Judge0 instance)
INSERT INTO languages (name, judge0_id) VALUES
('C++ (GCC 9.2.0)', 54),
('Python (3.8.1)', 71),
('JavaScript (Node.js 12.14.0)', 63);

-- Problems
INSERT INTO problems (slug, title, body_md, input_format, output_format, constraints_md, difficulty, time_limit_ms, memory_limit_kb, created_by)
VALUES
('sum-it-up','A. Sum It Up',
'# A. Sum It Up\nGiven two integers A and B, output A+B.',
'Two space-separated integers A and B (|A|,|B| ≤ 10^9).',
'One integer: A+B.',
'A+B within 64-bit signed integer range.',
'Easy', 1000, 262144, 1),

('balanced-brackets','B. Balanced Brackets',
'# B. Balanced Brackets\nCheck if a string of brackets is balanced.',
'One line with a string of brackets ()[]{} (length ≤ 1e5).',
'"YES" if balanced else "NO".',
'Use stack; O(n).',
'Medium', 2000, 262144, 1),

('shortest-path','C. Shortest Path',
'# C. Shortest Path\nGiven an unweighted graph, find shortest distance from 1 to N.',
'First line N M; then M edges u v (1-indexed).',
'Shortest distance from 1 to N or -1 if unreachable.',
'N ≤ 2e5, M ≤ 2e5; BFS.',
'Hard', 2000, 262144, 1);

-- Problem tags
INSERT INTO problem_tags (problem_id, tag_id) VALUES
(1,4),         -- math
(2,3),         -- strings
(2,5),         -- greedy (or stack-like)
(3,2);         -- graphs

-- Examples
INSERT INTO problem_examples (problem_id, example_order, input_text, output_text, explanation) VALUES
(1,1,'2 3','5','2+3=5'),
(1,2,'-7 4','-3','-7+4=-3'),
(2,1,'([]){}','YES','All brackets matched'),
(2,2,'([)]','NO','Mismatched nesting'),
(3,1,'4 3\n1 2\n2 3\n3 4','3','1→2→3→4 distance 3');

-- Test cases (samples + hidden)
INSERT INTO test_cases (problem_id, case_order, input_data, expected_output, is_sample, score_weight, visibility) VALUES
-- A. Sum It Up
(1,1,'2 3','5', TRUE, 1, 'sample'),
(1,2,'100 250','350', FALSE, 1, 'hidden'),
(1,3,'-7 4','-3', FALSE, 1, 'hidden'),
-- B. Balanced Brackets
(2,1,'([]){}','YES', TRUE, 1, 'sample'),
(2,2,'([)]','NO', TRUE, 1, 'sample'),
(2,3,'(((())))','YES', FALSE, 1, 'hidden'),
-- C. Shortest Path
(3,1,'4 3\n1 2\n2 3\n3 4','3', TRUE, 1, 'sample'),
(3,2,'3 1\n1 2','-1', FALSE, 1, 'hidden'),
(3,3,'5 5\n1 2\n2 3\n1 4\n4 5\n5 3','2', FALSE, 1, 'hidden');

-- Contests
INSERT INTO contests (title, description, start_time, end_time, visibility, share_token, is_virtual, rating_effect, created_by)
VALUES
('Brain Jam Beta #1','Kickoff contest with 3 problems.','2025-08-20 14:00:00','2025-08-20 16:00:00','public','BETA1XYZ', FALSE, TRUE, 1);

-- Contest problems
INSERT INTO contest_problems (contest_id, problem_id, display_order, points) VALUES
(1,1,1,100),
(1,2,2,200),
(1,3,3,300);

-- Contest participants
INSERT INTO contest_participants (contest_id, user_id) VALUES
(1,2),(1,3),(1,4);

-- Difficulty votes (1..5)
INSERT INTO problem_difficulty_votes (problem_id, user_id, score) VALUES
(1,2,1),(1,3,1),
(2,2,3),(2,3,4),(2,4,3),
(3,3,5),(3,4,4);

-- Badges
INSERT INTO badges (code, name, description) VALUES
('FIRST_ACCEPTED','First Accepted','Earned after first accepted submission.'),
('TEN_SOLVES','10 Solves','Solve 10 problems.'),
('FIRST_CONTEST','First Contest','Participate in your first contest.');

-- User badges
INSERT INTO user_badges (user_id, badge_id) VALUES
(2,1);

-- Submissions (mix of contest/non-contest)
INSERT INTO submissions (user_id, problem_id, contest_id, language_id, source_code, stdin, status, score, execution_time_ms, memory_kb, judge0_token, verdict_details, plagiarism_flag, created_at)
VALUES
-- Bob solves A in contest
(2,1,1,2,'print(sum(map(int,input().split())))','2 3','Accepted',100,10,12000,'tok_abc', JSON_OBJECT('message','OK'), FALSE, '2025-08-20 14:15:00'),
-- Charlie wrong on B
(3,2,1,2,'print("YES")\n','([)]','Wrong Answer',0,5,8000,'tok_def', JSON_OBJECT('message','WA'), FALSE, '2025-08-20 14:25:00'),
-- Diana solves B
(4,2,1,2,'# stack solution...','([]){}','Accepted',200,25,15000,'tok_ghi', JSON_OBJECT('message','OK'), FALSE, '2025-08-20 14:40:00'),
-- Bob solves B later
(2,2,1,2,'# proper stack\n','(((())))','Accepted',200,30,14000,'tok_jkl', JSON_OBJECT('message','OK'), FALSE, '2025-08-20 15:05:00'),
-- Non-contest attempt on C by Eren
(5,3,NULL,1,'// BFS code...','5 5\n1 2\n2 3\n1 4\n4 5\n5 3','Accepted',300,120,256000,'tok_mno', JSON_OBJECT('message','OK'), FALSE, '2025-08-19 11:00:00');

-- Per-testcase results for two submissions
INSERT INTO submission_case_results (submission_id, test_case_id, status, execution_time_ms, memory_kb, stdout, stderr) VALUES
(1,1,'Accepted',10,12000,'5',''),
(1,2,'Accepted',9,11000,'350',''),
(2,4,'Wrong Answer',5,8000,'YES',''),
(3,4,'Accepted',20,15000,'YES','');

-- Contest scores (manually computed sample)
-- Bob: A(100) + B(200) = 300
-- Charlie: 0
-- Diana: B(200)
INSERT INTO contest_scores (contest_id, user_id, score, penalty_seconds, rank, last_submission_at) VALUES
(1,2,300,600,1,'2025-08-20 15:05:00'),
(1,4,200,240,2,'2025-08-20 14:40:00'),
(1,3,0,0,3,NULL);

-- Rating changes
INSERT INTO rating_history (user_id, contest_id, rating_before, rating_after, delta, reason, created_at) VALUES
(2,1,900,960,60,'contest','2025-08-20 16:05:00'),
(3,1,1100,1080,-20,'contest','2025-08-20 16:05:00'),
(4,1,1250,1270,20,'contest','2025-08-20 16:05:00');

-- Daily suggestion log
INSERT INTO daily_suggestions (user_id, problem_id, suggested_on) VALUES
(2,2, CURRENT_DATE);

-- Practice run sample
INSERT INTO practice_runs (user_id, problem_id, language_id, source_code, stdin, stdout, stderr, status, execution_time_ms, memory_kb, judge0_token)
VALUES
(2,1,2,'print(sum(map(int,input().split())))','10 20','30','', 'Accepted', 8, 9000, 'tok_prac');

-- Example plagiarism record (note: app must ensure a<b for (submission_id_a, submission_id_b))
INSERT INTO plagiarism_findings (submission_id_a, submission_id_b, similarity_percent, method, flagged_by)
VALUES (1,4,92.50,'string-match',1);