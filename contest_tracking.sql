-- Contest tracking tables
CREATE TABLE IF NOT EXISTS `contest_submissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contest_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `status` varchar(50) NOT NULL,
  `score` int(11) DEFAULT 0,
  `submitted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_submission` (`contest_id`, `user_id`, `problem_id`),
  KEY `contest_submissions_contest_id` (`contest_id`),
  KEY `contest_submissions_user_id` (`user_id`),
  KEY `contest_submissions_problem_id` (`problem_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contest_achievements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `contest_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `achievement_type` varchar(50) NOT NULL,
  `achieved_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_achievement` (`contest_id`, `user_id`, `achievement_type`),
  KEY `contest_achievements_contest_id` (`contest_id`),
  KEY `contest_achievements_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;