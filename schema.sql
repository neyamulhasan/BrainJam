CREATE DATABASE IF NOT EXISTS brain_jam DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE brain_jam;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

CREATE TABLE `badges` (
  `id` int(11) NOT NULL,
  `code` varchar(32) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `contests` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `visibility` enum('public','private','unlisted') NOT NULL DEFAULT 'public',
  `access_code` varchar(32) DEFAULT NULL,
  `share_token` varchar(64) DEFAULT NULL,
  `is_virtual` tinyint(1) NOT NULL DEFAULT 0,
  `based_on_contest_id` int(11) DEFAULT NULL,
  `rating_effect` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `contest_participants` (
  `contest_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `joined_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `contest_problems` (
  `contest_id` int(11) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `display_order` int(11) NOT NULL,
  `points` int(11) NOT NULL DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `contest_scores` (
  `contest_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `score` int(11) NOT NULL DEFAULT 0,
  `penalty_seconds` int(11) NOT NULL DEFAULT 0,
  `rank` int(11) DEFAULT NULL,
  `last_submission_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `daily_suggestions` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `suggested_on` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `friends` (
  `user_id` int(11) NOT NULL,
  `friend_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `languages` (
  `id` int(11) NOT NULL,
  `name` varchar(64) NOT NULL,
  `judge0_id` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `plagiarism_findings` (
  `id` bigint(20) NOT NULL,
  `submission_id_a` bigint(20) NOT NULL,
  `submission_id_b` bigint(20) NOT NULL,
  `similarity_percent` decimal(5,2) NOT NULL,
  `method` varchar(32) DEFAULT 'local',
  `flagged_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `practice_runs` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `problem_id` int(11) DEFAULT NULL,
  `language_id` int(11) DEFAULT NULL,
  `source_code` mediumtext DEFAULT NULL,
  `stdin` text DEFAULT NULL,
  `stdout` text DEFAULT NULL,
  `stderr` text DEFAULT NULL,
  `status` enum('Accepted','Wrong Answer','Compilation Error','Runtime Error','Time Limit Exceeded','Memory Limit Exceeded','Internal Error') DEFAULT NULL,
  `execution_time_ms` int(11) DEFAULT NULL,
  `memory_kb` int(11) DEFAULT NULL,
  `judge0_token` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `problems` (
  `id` int(11) NOT NULL,
  `slug` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `body_md` mediumtext NOT NULL,
  `input_format` text DEFAULT NULL,
  `output_format` text DEFAULT NULL,
  `constraints_md` text DEFAULT NULL,
  `difficulty` enum('Easy','Medium','Hard') NOT NULL DEFAULT 'Easy',
  `time_limit_ms` int(11) NOT NULL DEFAULT 1000,
  `memory_limit_kb` int(11) NOT NULL DEFAULT 262144,
  `is_public` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `problem_difficulty_votes` (
  `problem_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `score` tinyint(4) NOT NULL CHECK (`score` between 1 and 5),
  `voted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `problem_examples` (
  `id` int(11) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `example_order` int(11) NOT NULL,
  `input_text` text NOT NULL,
  `output_text` text NOT NULL,
  `explanation` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `problem_tags` (
  `problem_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `rating_history` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `contest_id` int(11) DEFAULT NULL,
  `rating_before` int(11) NOT NULL,
  `rating_after` int(11) NOT NULL,
  `delta` int(11) NOT NULL,
  `reason` enum('contest','problem_solve','manual') NOT NULL DEFAULT 'contest',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `submissions` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `contest_id` int(11) DEFAULT NULL,
  `language_id` int(11) NOT NULL,
  `source_code` mediumtext NOT NULL,
  `stdin` text DEFAULT NULL,
  `status` enum('Pending','In Queue','Processing','Accepted','Wrong Answer','Compilation Error','Runtime Error','Time Limit Exceeded','Memory Limit Exceeded','Internal Error') NOT NULL DEFAULT 'Pending',
  `score` int(11) NOT NULL DEFAULT 0,
  `execution_time_ms` int(11) DEFAULT NULL,
  `memory_kb` int(11) DEFAULT NULL,
  `judge0_token` varchar(64) DEFAULT NULL,
  `verdict_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`verdict_details`)),
  `plagiarism_flag` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `submission_case_results` (
  `id` bigint(20) NOT NULL,
  `submission_id` bigint(20) NOT NULL,
  `test_case_id` int(11) NOT NULL,
  `status` enum('Accepted','Wrong Answer','Runtime Error','Time Limit Exceeded','Memory Limit Exceeded','Skipped') NOT NULL,
  `execution_time_ms` int(11) DEFAULT NULL,
  `memory_kb` int(11) DEFAULT NULL,
  `stdout` text DEFAULT NULL,
  `stderr` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `test_cases` (
  `id` int(11) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `case_order` int(11) NOT NULL,
  `input_data` text NOT NULL,
  `expected_output` text NOT NULL,
  `is_sample` tinyint(1) NOT NULL DEFAULT 0,
  `score_weight` int(11) NOT NULL DEFAULT 1,
  `visibility` enum('hidden','sample') NOT NULL DEFAULT 'hidden'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Table for user posts
CREATE TABLE `posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for post reactions (likes/dislikes)
CREATE TABLE `post_reactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reaction_type` enum('like', 'dislike') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_post_reaction` (`post_id`, `user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `post_reactions_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `post_reactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create a view to easily get post statistics
CREATE OR REPLACE VIEW `post_stats` AS
SELECT 
  p.id AS post_id,
  p.user_id,
  p.content,
  p.created_at,
  COUNT(DISTINCT CASE WHEN pr.reaction_type = 'like' THEN pr.user_id END) AS likes_count,
  COUNT(DISTINCT CASE WHEN pr.reaction_type = 'dislike' THEN pr.user_id END) AS dislikes_count,
  (COUNT(DISTINCT CASE WHEN pr.reaction_type = 'like' THEN pr.user_id END) - 
   COUNT(DISTINCT CASE WHEN pr.reaction_type = 'dislike' THEN pr.user_id END)) AS net_votes
FROM posts p
LEFT JOIN post_reactions pr ON p.id = pr.post_id
GROUP BY p.id;

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(32) NOT NULL,
  `email` varchar(120) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `rating` int(11) NOT NULL DEFAULT 800,
  `rank_label` enum('Private Recruit','Cadet Coder','Code Corporal','Tech Lieutenant','Algorithm Captain','Legendary General') NOT NULL DEFAULT 'Private Recruit',
  `avatar_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_badges` (
  `user_id` int(11) NOT NULL,
  `badge_id` int(11) NOT NULL,
  `earned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_stats` (
  `user_id` int(11) NOT NULL,
  `solved_count` int(11) NOT NULL DEFAULT 0,
  `contest_count` int(11) NOT NULL DEFAULT 0,
  `win_count` int(11) NOT NULL DEFAULT 0,
  `streak_days` int(11) NOT NULL DEFAULT 0,
  `last_active_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
ALTER TABLE `badges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

ALTER TABLE `contests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `access_code` (`access_code`),
  ADD UNIQUE KEY `share_token` (`share_token`),
  ADD KEY `based_on_contest_id` (`based_on_contest_id`),
  ADD KEY `created_by` (`created_by`);

ALTER TABLE `contest_participants`
  ADD PRIMARY KEY (`contest_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `contest_problems`
  ADD PRIMARY KEY (`contest_id`,`problem_id`),
  ADD KEY `problem_id` (`problem_id`),
  ADD KEY `idx_contest_problems_order` (`contest_id`,`display_order`);

ALTER TABLE `contest_scores`
  ADD PRIMARY KEY (`contest_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `daily_suggestions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_date` (`user_id`,`suggested_on`),
  ADD KEY `problem_id` (`problem_id`);

ALTER TABLE `friends`
  ADD PRIMARY KEY (`user_id`,`friend_id`),
  ADD KEY `friend_id` (`friend_id`);

ALTER TABLE `languages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_judge0` (`judge0_id`);

ALTER TABLE `plagiarism_findings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pair` (`submission_id_a`,`submission_id_b`),
  ADD KEY `submission_id_b` (`submission_id_b`),
  ADD KEY `flagged_by` (`flagged_by`);

ALTER TABLE `practice_runs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `problem_id` (`problem_id`),
  ADD KEY `language_id` (`language_id`);

ALTER TABLE `problems`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `created_by` (`created_by`);

ALTER TABLE `problem_difficulty_votes`
  ADD PRIMARY KEY (`problem_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `problem_examples`
  ADD PRIMARY KEY (`id`),
  ADD KEY `problem_id` (`problem_id`);

ALTER TABLE `problem_tags`
  ADD PRIMARY KEY (`problem_id`,`tag_id`),
  ADD KEY `tag_id` (`tag_id`);

ALTER TABLE `rating_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `contest_id` (`contest_id`);

ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `language_id` (`language_id`),
  ADD KEY `idx_submissions_problem_user` (`problem_id`,`user_id`),
  ADD KEY `idx_submissions_contest_user` (`contest_id`,`user_id`),
  ADD KEY `idx_submissions_status` (`status`);

ALTER TABLE `submission_case_results`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_submission_case` (`submission_id`,`test_case_id`),
  ADD KEY `test_case_id` (`test_case_id`);

ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

ALTER TABLE `test_cases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_test_cases_problem_order` (`problem_id`,`case_order`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

ALTER TABLE `user_badges`
  ADD PRIMARY KEY (`user_id`,`badge_id`),
  ADD KEY `badge_id` (`badge_id`);

ALTER TABLE `user_stats`
  ADD PRIMARY KEY (`user_id`);

ALTER TABLE `badges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `contests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `daily_suggestions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

ALTER TABLE `languages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `plagiarism_findings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

ALTER TABLE `practice_runs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

ALTER TABLE `problems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `problem_examples`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `rating_history`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

ALTER TABLE `submissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

ALTER TABLE `submission_case_results`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

ALTER TABLE `tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `test_cases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `contests`
  ADD CONSTRAINT `contests_ibfk_1` FOREIGN KEY (`based_on_contest_id`) REFERENCES `contests` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `contests_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `contest_participants`
  ADD CONSTRAINT `contest_participants_ibfk_1` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contest_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `contest_problems`
  ADD CONSTRAINT `contest_problems_ibfk_1` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contest_problems_ibfk_2` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE;

ALTER TABLE `contest_scores`
  ADD CONSTRAINT `contest_scores_ibfk_1` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contest_scores_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `daily_suggestions`
  ADD CONSTRAINT `daily_suggestions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `daily_suggestions_ibfk_2` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE;

ALTER TABLE `friends`
  ADD CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`friend_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `plagiarism_findings`
  ADD CONSTRAINT `plagiarism_findings_ibfk_1` FOREIGN KEY (`submission_id_a`) REFERENCES `submissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `plagiarism_findings_ibfk_2` FOREIGN KEY (`submission_id_b`) REFERENCES `submissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `plagiarism_findings_ibfk_3` FOREIGN KEY (`flagged_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `practice_runs`
  ADD CONSTRAINT `practice_runs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `practice_runs_ibfk_2` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `practice_runs_ibfk_3` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON DELETE SET NULL;

ALTER TABLE `problems`
  ADD CONSTRAINT `problems_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

ALTER TABLE `problem_difficulty_votes`
  ADD CONSTRAINT `problem_difficulty_votes_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `problem_difficulty_votes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

ALTER TABLE `problem_examples`
  ADD CONSTRAINT `problem_examples_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE;

ALTER TABLE `problem_tags`
  ADD CONSTRAINT `problem_tags_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `problem_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;

ALTER TABLE `rating_history`
  ADD CONSTRAINT `rating_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rating_history_ibfk_2` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE SET NULL;

ALTER TABLE `submissions`
  ADD CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `submissions_ibfk_3` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `submissions_ibfk_4` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`);

ALTER TABLE `submission_case_results`
  ADD CONSTRAINT `submission_case_results_ibfk_1` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `submission_case_results_ibfk_2` FOREIGN KEY (`test_case_id`) REFERENCES `test_cases` (`id`) ON DELETE CASCADE;

ALTER TABLE `test_cases`
  ADD CONSTRAINT `test_cases_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_badges`
  ADD CONSTRAINT `user_badges_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_badges_ibfk_2` FOREIGN KEY (`badge_id`) REFERENCES `badges` (`id`) ON DELETE CASCADE;

ALTER TABLE `user_stats`
  ADD CONSTRAINT `user_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;