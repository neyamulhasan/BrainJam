-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:4306
-- Generation Time: Oct 08, 2025 at 05:37 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `brain_jam`
--

-- --------------------------------------------------------

--
-- Table structure for table `badges`
--

CREATE TABLE `badges` (
  `id` int(11) NOT NULL,
  `code` varchar(32) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `badges`
--

INSERT INTO `badges` (`id`, `code`, `name`, `description`) VALUES
(1, 'FIRST_ACCEPTED', 'First Accepted', 'Earned after first accepted submission.'),
(2, 'TEN_SOLVES', '10 Solves', 'Solve 10 problems.'),
(3, 'FIRST_CONTEST', 'First Contest', 'Participate in your first contest.'),
(4, 'contest_warrior', 'Contest Warrior', 'Participated in 5 contests'),
(5, 'problem_crusher', 'Problem Crusher', 'Solved 100+ problems');

-- --------------------------------------------------------

--
-- Table structure for table `contests`
--

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

--
-- Dumping data for table `contests`
--

INSERT INTO `contests` (`id`, `title`, `description`, `start_time`, `end_time`, `visibility`, `access_code`, `share_token`, `is_virtual`, `based_on_contest_id`, `rating_effect`, `created_by`, `created_at`) VALUES
(1, 'Brain Jam Beta #1', 'Kickoff contest with 3 problems.', '2025-08-20 14:00:00', '2025-08-20 16:00:00', 'public', NULL, 'BETA1XYZ', 0, NULL, 1, 1, '2025-08-16 17:56:05'),
(2, 'Weekly Contest 2', 'Weekly coding contest', '2024-07-21 10:00:00', '2024-07-21 12:00:00', 'public', NULL, NULL, 0, NULL, 1, NULL, '2025-08-23 13:54:46'),
(3, 'Weekly Contest 3', 'Weekly coding contest', '2024-07-22 10:00:00', '2024-07-22 12:00:00', 'public', NULL, NULL, 0, NULL, 1, NULL, '2025-08-23 13:54:46');

-- --------------------------------------------------------

--
-- Table structure for table `contest_participants`
--

CREATE TABLE `contest_participants` (
  `contest_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `joined_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contest_participants`
--

INSERT INTO `contest_participants` (`contest_id`, `user_id`, `joined_at`) VALUES
(1, 2, '2025-08-16 23:56:05'),
(1, 3, '2025-08-16 23:56:05'),
(1, 4, '2025-08-16 23:56:05');

-- --------------------------------------------------------

--
-- Table structure for table `contest_problems`
--

CREATE TABLE `contest_problems` (
  `contest_id` int(11) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `display_order` int(11) NOT NULL,
  `points` int(11) NOT NULL DEFAULT 100
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contest_problems`
--

INSERT INTO `contest_problems` (`contest_id`, `problem_id`, `display_order`, `points`) VALUES
(1, 1, 1, 100),
(1, 2, 2, 200),
(1, 3, 3, 300);

-- --------------------------------------------------------

--
-- Table structure for table `contest_scores`
--

CREATE TABLE `contest_scores` (
  `contest_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `score` int(11) NOT NULL DEFAULT 0,
  `penalty_seconds` int(11) NOT NULL DEFAULT 0,
  `rank` int(11) DEFAULT NULL,
  `last_submission_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contest_scores`
--

INSERT INTO `contest_scores` (`contest_id`, `user_id`, `score`, `penalty_seconds`, `rank`, `last_submission_at`) VALUES
(1, 2, 300, 600, 1, '2025-08-20 15:05:00'),
(1, 3, 0, 0, 3, NULL),
(1, 4, 200, 240, 2, '2025-08-20 14:40:00');

-- --------------------------------------------------------

--
-- Table structure for table `daily_suggestions`
--

CREATE TABLE `daily_suggestions` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `suggested_on` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `daily_suggestions`
--

INSERT INTO `daily_suggestions` (`id`, `user_id`, `problem_id`, `suggested_on`) VALUES
(1, 2, 2, '2025-08-16');

-- --------------------------------------------------------

--
-- Table structure for table `friends`
--

CREATE TABLE `friends` (
  `user_id` int(11) NOT NULL,
  `friend_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `friends`
--

INSERT INTO `friends` (`user_id`, `friend_id`, `created_at`) VALUES
(2, 3, '2025-08-16 17:56:05'),
(2, 4, '2025-08-16 17:56:05'),
(3, 2, '2025-08-16 17:56:05'),
(4, 2, '2025-08-16 17:56:05'),
(7, 42, '2025-08-23 16:21:17'),
(7, 43, '2025-08-23 16:21:17');

-- --------------------------------------------------------

--
-- Table structure for table `languages`
--

CREATE TABLE `languages` (
  `id` int(11) NOT NULL,
  `name` varchar(64) NOT NULL,
  `judge0_id` int(11) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `languages`
--

INSERT INTO `languages` (`id`, `name`, `judge0_id`, `is_active`) VALUES
(1, 'C++ (GCC 9.2.0)', 54, 1),
(2, 'Python (3.8.1)', 71, 1),
(3, 'JavaScript (Node.js 12.14.0)', 63, 1),
(5, 'C', 50, 1);

-- --------------------------------------------------------

--
-- Table structure for table `learning_categories`
--

CREATE TABLE `learning_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `learning_categories`
--

INSERT INTO `learning_categories` (`id`, `name`, `slug`, `description`, `created_at`, `updated_at`) VALUES
(1, 'Algorithms', 'algorithms', 'Fundamental algorithms and techniques for solving computational problems', '2025-09-20 13:39:48', '2025-09-20 13:39:48'),
(2, 'Data Structures', 'data-structures', 'Essential data structures for efficient data organization and retrieval', '2025-09-20 13:39:48', '2025-09-20 13:39:48'),
(3, 'System Design', 'system-design', 'Principles and patterns for designing scalable systems', '2025-09-20 13:39:48', '2025-09-20 13:39:48'),
(4, 'Web Development', 'web-development', 'Technologies and frameworks for building web applications', '2025-09-20 13:39:48', '2025-09-20 13:39:48'),
(5, 'Mobile Development', 'mobile-development', 'App development for iOS, Android, and cross-platform frameworks', '2025-09-20 13:39:48', '2025-09-20 13:39:48');

-- --------------------------------------------------------

--
-- Table structure for table `learning_resources`
--

CREATE TABLE `learning_resources` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `category_id` int(11) NOT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `author_id` int(11) NOT NULL,
  `featured_image` varchar(255) DEFAULT NULL,
  `meta_description` varchar(255) DEFAULT NULL,
  `view_count` int(11) NOT NULL DEFAULT 0,
  `estimated_read_time` int(11) DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `learning_resources`
--

INSERT INTO `learning_resources` (`id`, `title`, `slug`, `content`, `category_id`, `status`, `author_id`, `featured_image`, `meta_description`, `view_count`, `estimated_read_time`, `published_at`, `created_at`, `updated_at`) VALUES
(2, 'Data Structure Fundamentals', 'data-structure-fundamentals-84', '<p><strong>Data structures</strong> are systematic ways of organizing, managing, and storing data so that it can be accessed and modified efficiently. They provide the foundation for designing efficient algorithms and enable programmers to handle large and complex datasets effectively. Common examples include arrays, linked lists, stacks, queues, trees, and graphs—each suited for different types of operations and problem-solving scenarios. Understanding data structures is essential because the choice of structure directly impacts the performance of a program in terms of speed and memory usage.</p><p>The study of data structures also introduces important concepts such as abstraction, dynamic memory allocation, and data relationships. For instance, stacks and queues follow specific principles like Last-In-First-Out (LIFO) and First-In-First-Out (FIFO), respectively, which make them useful in scenarios such as function calls, undo operations, and task scheduling. Similarly, advanced structures like trees and graphs allow efficient representation of hierarchical data and networks, forming the basis for applications such as file systems, routing, and social networks.</p><p>Ultimately, mastering data structure fundamentals equips learners with the tools to design solutions that are both effective and optimized. By choosing the right data structure for a given problem, developers can minimize computational costs, ensure scalability, and improve the overall efficiency of their software systems.</p>', 2, 'draft', 46, NULL, '', 0, 2, NULL, '2025-09-20 14:33:20', '2025-09-20 14:33:20'),
(3, 'Introduction to Algorithms', 'introduction-to-algorithms-163', '<p>An algorithm is a well-defined sequence of steps or instructions that helps in solving a problem or accomplishing a specific task. In computer science, algorithms serve as the backbone of programming, providing systematic approaches to handle operations ranging from basic arithmetic calculations to highly complex processes such as artificial intelligence. The importance of algorithms lies in their ability to break down problems into smaller, manageable parts, making them easier to understand and solve.</p><p>Algorithms are not only about finding solutions but also about finding efficient solutions. Since multiple algorithms may exist for the same problem, computer scientists focus on analyzing their performance using measures such as time complexity and space complexity. This analysis helps in choosing the most suitable algorithm depending on the problem constraints and available resources. For example, sorting algorithms like Quick Sort and Merge Sort achieve similar goals but differ in efficiency depending on the dataset.</p><p>In today’s world, algorithms have become an inseparable part of technology and daily life. They power search engines, recommend content on social media, secure information through cryptography, and enable innovations in fields like healthcare and robotics. By studying algorithms, learners gain not only problem-solving skills but also the ability to design optimized solutions that drive modern computing.</p>', 1, 'published', 46, '/uploads/learning/resource-1758381645621-666317679.jpg', NULL, 2, 2, '2025-09-20 16:00:46', '2025-09-20 15:20:45', '2025-09-26 12:23:37');

-- --------------------------------------------------------

--
-- Table structure for table `learning_resource_tags`
--

CREATE TABLE `learning_resource_tags` (
  `resource_id` int(11) NOT NULL,
  `tag` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `learning_resource_votes`
--

CREATE TABLE `learning_resource_votes` (
  `id` int(11) NOT NULL,
  `resource_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `vote_type` enum('upvote','downvote') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `plagiarism_findings`
--

CREATE TABLE `plagiarism_findings` (
  `id` bigint(20) NOT NULL,
  `submission_id_a` bigint(20) NOT NULL,
  `submission_id_b` bigint(20) NOT NULL,
  `similarity_percent` decimal(5,2) NOT NULL,
  `method` varchar(32) DEFAULT 'local',
  `flagged_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `plagiarism_findings`
--

INSERT INTO `plagiarism_findings` (`id`, `submission_id_a`, `submission_id_b`, `similarity_percent`, `method`, `flagged_by`, `created_at`) VALUES
(1, 1, 4, 92.50, 'string-match', 1, '2025-08-16 17:56:05');

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` bigint(20) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`id`, `user_id`, `content`, `created_at`) VALUES
(1, 7, 'hello, this is my first post.', '2025-08-23 19:05:15');

-- --------------------------------------------------------

--
-- Table structure for table `post_reactions`
--

CREATE TABLE `post_reactions` (
  `id` int(11) NOT NULL,
  `post_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `reaction_type` enum('like','dislike') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `post_reactions`
--

INSERT INTO `post_reactions` (`id`, `post_id`, `user_id`, `reaction_type`, `created_at`) VALUES
(1, 1, 7, 'like', '2025-08-23 19:05:17');

-- --------------------------------------------------------

--
-- Stand-in structure for view `post_stats`
-- (See below for the actual view)
--
CREATE TABLE `post_stats` (
`post_id` int(11)
,`user_id` int(11)
,`content` text
,`created_at` timestamp
,`likes_count` bigint(21)
,`dislikes_count` bigint(21)
,`net_votes` bigint(22)
);

-- --------------------------------------------------------

--
-- Table structure for table `practice_runs`
--

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

--
-- Dumping data for table `practice_runs`
--

INSERT INTO `practice_runs` (`id`, `user_id`, `problem_id`, `language_id`, `source_code`, `stdin`, `stdout`, `stderr`, `status`, `execution_time_ms`, `memory_kb`, `judge0_token`, `created_at`) VALUES
(1, 2, 1, 2, 'print(sum(map(int,input().split())))', '10 20', '30', '', 'Accepted', 8, 9000, 'tok_prac', '2025-08-16 17:56:05');

-- --------------------------------------------------------

--
-- Table structure for table `problems`
--

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

--
-- Dumping data for table `problems`
--

INSERT INTO `problems` (`id`, `slug`, `title`, `body_md`, `input_format`, `output_format`, `constraints_md`, `difficulty`, `time_limit_ms`, `memory_limit_kb`, `is_public`, `created_by`, `created_at`) VALUES
(1, 'sum-it-up', 'Sum It Up', 'Sum It Up\r\nGiven two integers A and B, output A+B.', 'Two space-separated integers A and B (|A|,|B| ≤ 10^9).', 'One integer: A+B.', 'A+B within 64-bit signed integer range.', 'Easy', 1000, 262144, 1, 1, '2025-08-16 17:56:05'),
(2, 'balanced-brackets', 'Balanced Brackets', 'Balanced Brackets\r\nCheck if a string of brackets is balanced.', 'One line with a string of brackets ()[]{} (length ≤ 1e5).', '\"YES\" if balanced else \"NO\".', 'Use stack; O(n).', 'Medium', 2000, 262144, 1, 1, '2025-08-16 17:56:05'),
(3, 'shortest-path', 'Shortest Path', 'Shortest Path\r\nGiven an unweighted graph, find shortest distance from 1 to N.', 'First line N M; then M edges u v (1-indexed).', 'Shortest distance from 1 to N or -1 if unreachable.', 'N ≤ 2e5, M ≤ 2e5; BFS.', 'Hard', 2000, 262144, 1, 1, '2025-08-16 17:56:05'),
(4, 'two-sum', 'Two Sum', 'Two Sum Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.', 'First line contains n (array size) and target separated by space. Second line contains n space-separated integers', 'Two space-separated integers representing the indices', NULL, 'Easy', 1000, 262144, 1, NULL, '2025-10-01 16:30:03');

-- --------------------------------------------------------

--
-- Table structure for table `problem_difficulty_votes`
--

CREATE TABLE `problem_difficulty_votes` (
  `problem_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `score` tinyint(4) NOT NULL CHECK (`score` between 1 and 5),
  `voted_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `problem_difficulty_votes`
--

INSERT INTO `problem_difficulty_votes` (`problem_id`, `user_id`, `score`, `voted_at`) VALUES
(1, 2, 1, '2025-08-16 17:56:05'),
(1, 3, 1, '2025-08-16 17:56:05'),
(2, 2, 3, '2025-08-16 17:56:05'),
(2, 3, 4, '2025-08-16 17:56:05'),
(2, 4, 3, '2025-08-16 17:56:05'),
(3, 3, 5, '2025-08-16 17:56:05'),
(3, 4, 4, '2025-08-16 17:56:05');

-- --------------------------------------------------------

--
-- Table structure for table `problem_examples`
--

CREATE TABLE `problem_examples` (
  `id` int(11) NOT NULL,
  `problem_id` int(11) NOT NULL,
  `example_order` int(11) NOT NULL,
  `input_text` text NOT NULL,
  `output_text` text NOT NULL,
  `explanation` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `problem_examples`
--

INSERT INTO `problem_examples` (`id`, `problem_id`, `example_order`, `input_text`, `output_text`, `explanation`) VALUES
(1, 1, 1, '2 3', '5', '2+3=5'),
(2, 1, 2, '-7 4', '-3', '-7+4=-3'),
(3, 2, 1, '([]){}', 'YES', 'All brackets matched'),
(4, 2, 2, '([)]', 'NO', 'Mismatched nesting'),
(5, 3, 1, '4 3\n1 2\n2 3\n3 4', '3', '1→2→3→4 distance 3'),
(6, 4, 1, '4 9\n2 7 11 15', '0 1', 'Because nums[0] + nums[1] == 9, we return [0, 1].'),
(7, 4, 2, '3 6\n3 2 4', '1 2', 'Because nums[1] + nums[2] == 6, we return [1, 2].');

-- --------------------------------------------------------

--
-- Table structure for table `problem_tags`
--

CREATE TABLE `problem_tags` (
  `problem_id` int(11) NOT NULL,
  `tag_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `problem_tags`
--

INSERT INTO `problem_tags` (`problem_id`, `tag_id`) VALUES
(1, 4),
(2, 3),
(2, 5),
(3, 2),
(4, 4),
(4, 6);

-- --------------------------------------------------------

--
-- Table structure for table `rating_history`
--

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

--
-- Dumping data for table `rating_history`
--

INSERT INTO `rating_history` (`id`, `user_id`, `contest_id`, `rating_before`, `rating_after`, `delta`, `reason`, `created_at`) VALUES
(190, 7, NULL, 972, 1063, 91, 'problem_solve', '2025-08-23 18:31:07'),
(191, 7, NULL, 1063, 1184, 121, 'problem_solve', '2025-08-23 18:31:07'),
(192, 7, NULL, 1184, 1283, 99, 'problem_solve', '2025-08-23 18:31:23'),
(193, 7, NULL, 1283, 1384, 101, 'problem_solve', '2025-09-21 03:42:09'),
(194, 7, NULL, 1384, 1443, 59, 'problem_solve', '2025-09-21 03:42:10'),
(195, 7, NULL, 1443, 1545, 102, 'problem_solve', '2025-09-21 03:42:10'),
(196, 7, NULL, 1545, 1657, 112, 'problem_solve', '2025-09-21 03:42:11'),
(197, 7, NULL, 1657, 1728, 71, 'problem_solve', '2025-09-21 03:42:11');

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

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

--
-- Dumping data for table `submissions`
--

INSERT INTO `submissions` (`id`, `user_id`, `problem_id`, `contest_id`, `language_id`, `source_code`, `stdin`, `status`, `score`, `execution_time_ms`, `memory_kb`, `judge0_token`, `verdict_details`, `plagiarism_flag`, `created_at`, `updated_at`) VALUES
(1, 2, 1, 1, 2, 'print(sum(map(int,input().split())))', '2 3', 'Accepted', 100, 10, 12000, 'tok_abc', '{\"message\": \"OK\"}', 0, '2025-08-20 08:15:00', '2025-08-16 17:56:05'),
(2, 3, 2, 1, 2, 'print(\"YES\")\n', '([)]', 'Wrong Answer', 0, 5, 8000, 'tok_def', '{\"message\": \"WA\"}', 0, '2025-08-20 08:25:00', '2025-08-16 17:56:05'),
(3, 4, 2, 1, 2, '# stack solution...', '([]){}', 'Accepted', 200, 25, 15000, 'tok_ghi', '{\"message\": \"OK\"}', 0, '2025-08-20 08:40:00', '2025-08-16 17:56:05'),
(4, 2, 2, 1, 2, '# proper stack\n', '(((())))', 'Accepted', 200, 30, 14000, 'tok_jkl', '{\"message\": \"OK\"}', 0, '2025-08-20 09:05:00', '2025-08-16 17:56:05'),
(5, 5, 3, NULL, 1, '// BFS code...', '5 5\n1 2\n2 3\n1 4\n4 5\n5 3', 'Accepted', 300, 120, 256000, 'tok_mno', '{\"message\": \"OK\"}', 0, '2025-08-19 05:00:00', '2025-08-16 17:56:05');

-- --------------------------------------------------------

--
-- Table structure for table `submission_case_results`
--

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

--
-- Dumping data for table `submission_case_results`
--

INSERT INTO `submission_case_results` (`id`, `submission_id`, `test_case_id`, `status`, `execution_time_ms`, `memory_kb`, `stdout`, `stderr`) VALUES
(1, 1, 1, 'Accepted', 10, 12000, '5', ''),
(2, 1, 2, 'Accepted', 9, 11000, '350', ''),
(3, 2, 4, 'Wrong Answer', 5, 8000, 'YES', ''),
(4, 3, 4, 'Accepted', 20, 15000, 'YES', '');

-- --------------------------------------------------------

--
-- Table structure for table `tags`
--

CREATE TABLE `tags` (
  `id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tags`
--

INSERT INTO `tags` (`id`, `name`) VALUES
(6, 'Array'),
(21, 'Backtracking'),
(12, 'Binary Search'),
(22, 'Bit Manipulation'),
(1, 'dp'),
(9, 'Dynamic Programming'),
(24, 'Geometry'),
(14, 'Graph'),
(2, 'graphs'),
(5, 'Greedy'),
(18, 'Hash Table'),
(19, 'Linked List'),
(4, 'Math'),
(17, 'Queue'),
(20, 'Recursion'),
(23, 'Simulation'),
(13, 'Sorting'),
(16, 'Stack'),
(7, 'String'),
(3, 'strings'),
(15, 'Tree'),
(11, 'Two Pointers');

-- --------------------------------------------------------

--
-- Table structure for table `test_cases`
--

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

--
-- Dumping data for table `test_cases`
--

INSERT INTO `test_cases` (`id`, `problem_id`, `case_order`, `input_data`, `expected_output`, `is_sample`, `score_weight`, `visibility`) VALUES
(1, 1, 1, '2 3', '5', 1, 1, 'sample'),
(2, 1, 2, '100 250', '350', 0, 1, 'hidden'),
(3, 1, 3, '-7 4', '-3', 0, 1, 'hidden'),
(4, 2, 1, '([]){}', 'YES', 1, 1, 'sample'),
(5, 2, 2, '([)]', 'NO', 1, 1, 'sample'),
(6, 2, 3, '(((())))', 'YES', 0, 1, 'hidden'),
(7, 3, 1, '4 3\n1 2\n2 3\n3 4', '3', 1, 1, 'sample'),
(8, 3, 2, '3 1\n1 2', '-1', 0, 1, 'hidden'),
(9, 3, 3, '5 5\n1 2\n2 3\n1 4\n4 5\n5 3', '2', 0, 1, 'hidden');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

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

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `role`, `rating`, `rank_label`, `avatar_url`, `created_at`, `updated_at`) VALUES
(1, 'alice_admin', 'alice@example.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8h2dZQpime5FRCGDpa2BkLomqKgP/6', 'admin', 1500, 'Tech Lieutenant', NULL, '2025-08-16 17:56:05', '2025-08-16 17:56:05'),
(2, 'bob', 'bob@example.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8h2dZQpime5FRCGDpa2BkLomqKgP/6', 'user', 900, 'Private Recruit', NULL, '2025-08-16 17:56:05', '2025-08-16 17:56:05'),
(3, 'charlie', 'charlie@example.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8h2dZQpime5FRCGDpa2BkLomqKgP/6', 'user', 1100, 'Cadet Coder', NULL, '2025-08-16 17:56:05', '2025-08-16 17:56:05'),
(4, 'diana', 'diana@example.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8h2dZQpime5FRCGDpa2BkLomqKgP/6', 'user', 1250, 'Code Corporal', NULL, '2025-08-16 17:56:05', '2025-08-16 17:56:05'),
(5, 'eren', 'eren@example.com', '$2b$10$CwTycUXWue0Thq9StjUM0uJ8h2dZQpime5FRCGDpa2BkLomqKgP/6', 'user', 1400, 'Tech Lieutenant', NULL, '2025-08-16 17:56:05', '2025-08-16 17:56:05'),
(7, 'qwerty', 'qwerty@gmail.com', '$2b$12$3AmJf2Qzow8Ya.v/OSO9eeGJSr8qIjDqT1usi8EXbEl80KNVWsKAW', 'user', 1728, 'Tech Lieutenant', 'https://plus.unsplash.com/premium_photo-1689568126014-06fea9d5d341?fm=jpg.jpg', '2025-08-22 04:49:54', '2025-09-21 03:42:11'),
(8, 'qwertyu', 'qwertyu@gmail.com', '$2b$12$TA84qlSe87lbQGNrRaxMK.h1r0K3YRrS6PQcYhMgm/SRk7l9bHznm', 'user', 800, 'Private Recruit', NULL, '2025-08-22 17:58:22', '2025-08-22 17:58:22'),
(9, 'qwertyu12', 'qwertyu22@gmail.com', '$2b$12$UTy3AwDgpX9D9vUuDHpwoO/SYQ1/QyPUcAqUSjtaKvyHU9Oy/S7rq', 'user', 800, 'Private Recruit', NULL, '2025-08-22 17:59:53', '2025-08-22 17:59:53'),
(11, 'CodeMaster_2025', 'codemaster@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 2100, 'Legendary General', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(12, 'AlgoNinja', 'algoninja@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 2050, 'Legendary General', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(13, 'DevWarrior', 'devwarrior@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1950, 'Algorithm Captain', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(14, 'ByteBeast', 'bytebeast@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1900, 'Algorithm Captain', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(15, 'CodingAce', 'codingace@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1875, 'Algorithm Captain', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(16, 'techguru123', 'techguru@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1860, 'Algorithm Captain', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(17, 'programmerpro', 'programmerpro@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1840, 'Algorithm Captain', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(18, 'ScriptSage', 'scriptsage@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1820, 'Tech Lieutenant', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(19, 'LogicLord', 'logiclord@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1800, 'Tech Lieutenant', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(20, 'DataDriven', 'datadriven@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1780, 'Tech Lieutenant', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(21, 'CodeCrusher', 'codecrusher@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1750, 'Tech Lieutenant', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(22, 'AlgoExpert', 'algoexpert@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1720, 'Tech Lieutenant', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(23, 'PythonPro', 'pythonpro@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1680, 'Tech Lieutenant', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(24, 'JavaJedi', 'javajedi@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1650, 'Tech Lieutenant', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(25, 'CppChampion', 'cppchampion@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1600, 'Code Corporal', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(26, 'JSWizard', 'jswizard@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1550, 'Code Corporal', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(27, 'WebDev101', 'webdev101@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1500, 'Code Corporal', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(28, 'newbie_coder', 'newbie@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1200, 'Code Corporal', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(29, 'learning_fast', 'learning@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 1000, 'Cadet Coder', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(30, 'beginner_dev', 'beginner@example.com', '$2b$10$qiWZ6Io6Kd/2watpjl3CXOlUTce2MfQHzMHKcsb5FiIOdp0H7YIb2', 'user', 850, 'Private Recruit', '/images/default-avatar.svg', '2025-08-23 14:27:52', '2025-08-23 14:27:52'),
(31, 'alice_coder', 'alice@test.com', 'test_password', 'user', 1200, 'Code Corporal', NULL, '2025-08-23 16:10:15', '2025-08-23 16:10:15'),
(32, 'bob_solver', 'bob@test.com', 'test_password', 'user', 950, 'Cadet Coder', NULL, '2025-08-23 16:10:15', '2025-08-23 16:10:15'),
(33, 'charlie_dev', 'charlie@test.com', 'test_password', 'user', 1500, 'Tech Lieutenant', NULL, '2025-08-23 16:10:15', '2025-08-23 16:10:15'),
(34, 'diana_algo', 'diana@test.com', 'test_password', 'user', 1800, 'Algorithm Captain', NULL, '2025-08-23 16:10:15', '2025-08-23 16:10:15'),
(35, 'eve_master', 'eve@test.com', 'test_password', 'user', 2100, 'Legendary General', NULL, '2025-08-23 16:10:15', '2025-08-23 16:10:15'),
(41, 'staruser1', 'star1@example.com', 'hashedpassword', 'user', 2100, 'Legendary General', NULL, '2025-08-23 16:21:17', '2025-08-23 16:21:17'),
(42, 'staruser2', 'star2@example.com', 'hashedpassword', 'user', 1850, 'Algorithm Captain', NULL, '2025-08-23 16:21:17', '2025-08-23 16:21:17'),
(43, 'staruser3', 'star3@example.com', 'hashedpassword', 'user', 1600, 'Tech Lieutenant', NULL, '2025-08-23 16:21:17', '2025-08-23 16:21:17'),
(44, 'staruser4', 'star4@example.com', 'hashedpassword', 'user', 1200, 'Cadet Coder', NULL, '2025-08-23 16:21:17', '2025-08-23 16:21:17'),
(45, 'staruser5', 'star5@example.com', 'hashedpassword', 'user', 950, 'Private Recruit', NULL, '2025-08-23 16:21:17', '2025-08-23 16:21:17'),
(46, 'admin', 'admin@brainjam.com', '$2b$12$G4ZD1h.7kPyP5apSwGRmFO/myFrHA8SPK8TWancI0blqILurCuyGy', 'admin', 800, 'Private Recruit', NULL, '2025-09-20 13:22:58', '2025-09-20 13:23:38');

-- --------------------------------------------------------

--
-- Table structure for table `user_badges`
--

CREATE TABLE `user_badges` (
  `user_id` int(11) NOT NULL,
  `badge_id` int(11) NOT NULL,
  `earned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_badges`
--

INSERT INTO `user_badges` (`user_id`, `badge_id`, `earned_at`) VALUES
(2, 1, '2025-08-16 17:56:05');

-- --------------------------------------------------------

--
-- Table structure for table `user_stats`
--

CREATE TABLE `user_stats` (
  `user_id` int(11) NOT NULL,
  `solved_count` int(11) NOT NULL DEFAULT 0,
  `contest_count` int(11) NOT NULL DEFAULT 0,
  `win_count` int(11) NOT NULL DEFAULT 0,
  `streak_days` int(11) NOT NULL DEFAULT 0,
  `last_active_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_stats`
--

INSERT INTO `user_stats` (`user_id`, `solved_count`, `contest_count`, `win_count`, `streak_days`, `last_active_at`) VALUES
(1, 200, 10, 3, 5, NULL),
(2, 5, 1, 0, 1, NULL),
(3, 20, 3, 1, 2, NULL),
(4, 35, 4, 1, 0, NULL),
(5, 60, 7, 2, 6, NULL),
(7, 0, 0, 0, 0, NULL),
(8, 0, 0, 0, 0, NULL),
(9, 0, 0, 0, 0, NULL),
(11, 210, 10, 7, 7, '2025-08-23 20:27:52'),
(12, 205, 10, 6, 22, '2025-08-23 20:27:52'),
(13, 195, 9, 6, 0, '2025-08-23 20:27:52'),
(14, 190, 9, 6, 20, '2025-08-23 20:27:52'),
(15, 187, 9, 6, 2, '2025-08-23 20:27:52'),
(16, 186, 9, 6, 0, '2025-08-23 20:27:52'),
(17, 184, 9, 6, 16, '2025-08-23 20:27:52'),
(18, 182, 9, 6, 27, '2025-08-23 20:27:52'),
(19, 180, 9, 6, 28, '2025-08-23 20:27:52'),
(20, 178, 8, 5, 25, '2025-08-23 20:27:52'),
(21, 175, 8, 5, 28, '2025-08-23 20:27:52'),
(22, 172, 8, 5, 12, '2025-08-23 20:27:52'),
(23, 168, 8, 5, 13, '2025-08-23 20:27:52'),
(24, 165, 8, 5, 13, '2025-08-23 20:27:52'),
(25, 160, 8, 5, 16, '2025-08-23 20:27:52'),
(26, 155, 7, 5, 20, '2025-08-23 20:27:52'),
(27, 150, 7, 5, 23, '2025-08-23 20:27:52'),
(28, 120, 6, 4, 28, '2025-08-23 20:27:52'),
(29, 100, 5, 3, 10, '2025-08-23 20:27:52'),
(30, 85, 4, 2, 9, '2025-08-23 20:27:52'),
(31, 58, 3, 3, 6, NULL),
(32, 42, 10, 0, 4, NULL),
(33, 59, 3, 1, 19, NULL),
(34, 19, 7, 1, 16, NULL),
(35, 39, 2, 2, 21, NULL),
(46, 0, 0, 0, 0, NULL);

-- --------------------------------------------------------

--
-- Structure for view `post_stats`
--
DROP TABLE IF EXISTS `post_stats`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `post_stats`  AS SELECT `p`.`id` AS `post_id`, `p`.`user_id` AS `user_id`, `p`.`content` AS `content`, `p`.`created_at` AS `created_at`, count(distinct case when `pr`.`reaction_type` = 'like' then `pr`.`user_id` end) AS `likes_count`, count(distinct case when `pr`.`reaction_type` = 'dislike' then `pr`.`user_id` end) AS `dislikes_count`, count(distinct case when `pr`.`reaction_type` = 'like' then `pr`.`user_id` end) - count(distinct case when `pr`.`reaction_type` = 'dislike' then `pr`.`user_id` end) AS `net_votes` FROM (`posts` `p` left join `post_reactions` `pr` on(`p`.`id` = `pr`.`post_id`)) GROUP BY `p`.`id` ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `badges`
--
ALTER TABLE `badges`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indexes for table `contests`
--
ALTER TABLE `contests`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `access_code` (`access_code`),
  ADD UNIQUE KEY `share_token` (`share_token`),
  ADD KEY `based_on_contest_id` (`based_on_contest_id`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `contest_participants`
--
ALTER TABLE `contest_participants`
  ADD PRIMARY KEY (`contest_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `contest_problems`
--
ALTER TABLE `contest_problems`
  ADD PRIMARY KEY (`contest_id`,`problem_id`),
  ADD KEY `problem_id` (`problem_id`),
  ADD KEY `idx_contest_problems_order` (`contest_id`,`display_order`);

--
-- Indexes for table `contest_scores`
--
ALTER TABLE `contest_scores`
  ADD PRIMARY KEY (`contest_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `daily_suggestions`
--
ALTER TABLE `daily_suggestions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_user_date` (`user_id`,`suggested_on`),
  ADD KEY `problem_id` (`problem_id`);

--
-- Indexes for table `friends`
--
ALTER TABLE `friends`
  ADD PRIMARY KEY (`user_id`,`friend_id`),
  ADD KEY `friend_id` (`friend_id`);

--
-- Indexes for table `languages`
--
ALTER TABLE `languages`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_judge0` (`judge0_id`);

--
-- Indexes for table `learning_categories`
--
ALTER TABLE `learning_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `learning_resources`
--
ALTER TABLE `learning_resources`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `category_id` (`category_id`),
  ADD KEY `author_id` (`author_id`);

--
-- Indexes for table `learning_resource_tags`
--
ALTER TABLE `learning_resource_tags`
  ADD PRIMARY KEY (`resource_id`,`tag`);

--
-- Indexes for table `learning_resource_votes`
--
ALTER TABLE `learning_resource_votes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `resource_user_unique` (`resource_id`,`user_id`),
  ADD KEY `resource_id` (`resource_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `plagiarism_findings`
--
ALTER TABLE `plagiarism_findings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pair` (`submission_id_a`,`submission_id_b`),
  ADD KEY `submission_id_b` (`submission_id_b`),
  ADD KEY `flagged_by` (`flagged_by`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `created_at` (`created_at`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `post_reactions`
--
ALTER TABLE `post_reactions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_post_reaction` (`post_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `practice_runs`
--
ALTER TABLE `practice_runs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `problem_id` (`problem_id`),
  ADD KEY `language_id` (`language_id`);

--
-- Indexes for table `problems`
--
ALTER TABLE `problems`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `created_by` (`created_by`);

--
-- Indexes for table `problem_difficulty_votes`
--
ALTER TABLE `problem_difficulty_votes`
  ADD PRIMARY KEY (`problem_id`,`user_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `problem_examples`
--
ALTER TABLE `problem_examples`
  ADD PRIMARY KEY (`id`),
  ADD KEY `problem_id` (`problem_id`);

--
-- Indexes for table `problem_tags`
--
ALTER TABLE `problem_tags`
  ADD PRIMARY KEY (`problem_id`,`tag_id`),
  ADD KEY `tag_id` (`tag_id`);

--
-- Indexes for table `rating_history`
--
ALTER TABLE `rating_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `contest_id` (`contest_id`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `language_id` (`language_id`),
  ADD KEY `idx_submissions_problem_user` (`problem_id`,`user_id`),
  ADD KEY `idx_submissions_contest_user` (`contest_id`,`user_id`),
  ADD KEY `idx_submissions_status` (`status`);

--
-- Indexes for table `submission_case_results`
--
ALTER TABLE `submission_case_results`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_submission_case` (`submission_id`,`test_case_id`),
  ADD KEY `test_case_id` (`test_case_id`);

--
-- Indexes for table `tags`
--
ALTER TABLE `tags`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `test_cases`
--
ALTER TABLE `test_cases`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_test_cases_problem_order` (`problem_id`,`case_order`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `user_badges`
--
ALTER TABLE `user_badges`
  ADD PRIMARY KEY (`user_id`,`badge_id`),
  ADD KEY `badge_id` (`badge_id`);

--
-- Indexes for table `user_stats`
--
ALTER TABLE `user_stats`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `badges`
--
ALTER TABLE `badges`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `contests`
--
ALTER TABLE `contests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `daily_suggestions`
--
ALTER TABLE `daily_suggestions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `languages`
--
ALTER TABLE `languages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `learning_categories`
--
ALTER TABLE `learning_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `learning_resources`
--
ALTER TABLE `learning_resources`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `learning_resource_votes`
--
ALTER TABLE `learning_resource_votes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `plagiarism_findings`
--
ALTER TABLE `plagiarism_findings`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `post_reactions`
--
ALTER TABLE `post_reactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `practice_runs`
--
ALTER TABLE `practice_runs`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `problems`
--
ALTER TABLE `problems`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `problem_examples`
--
ALTER TABLE `problem_examples`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `rating_history`
--
ALTER TABLE `rating_history`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=198;

--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=256;

--
-- AUTO_INCREMENT for table `submission_case_results`
--
ALTER TABLE `submission_case_results`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tags`
--
ALTER TABLE `tags`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT for table `test_cases`
--
ALTER TABLE `test_cases`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `contests`
--
ALTER TABLE `contests`
  ADD CONSTRAINT `contests_ibfk_1` FOREIGN KEY (`based_on_contest_id`) REFERENCES `contests` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `contests_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `contest_participants`
--
ALTER TABLE `contest_participants`
  ADD CONSTRAINT `contest_participants_ibfk_1` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contest_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `contest_problems`
--
ALTER TABLE `contest_problems`
  ADD CONSTRAINT `contest_problems_ibfk_1` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contest_problems_ibfk_2` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `contest_scores`
--
ALTER TABLE `contest_scores`
  ADD CONSTRAINT `contest_scores_ibfk_1` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contest_scores_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `daily_suggestions`
--
ALTER TABLE `daily_suggestions`
  ADD CONSTRAINT `daily_suggestions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `daily_suggestions_ibfk_2` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `friends`
--
ALTER TABLE `friends`
  ADD CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`friend_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `learning_resources`
--
ALTER TABLE `learning_resources`
  ADD CONSTRAINT `learning_resources_author_fk` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `learning_resources_category_fk` FOREIGN KEY (`category_id`) REFERENCES `learning_categories` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `learning_resource_tags`
--
ALTER TABLE `learning_resource_tags`
  ADD CONSTRAINT `learning_resource_tags_fk` FOREIGN KEY (`resource_id`) REFERENCES `learning_resources` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `learning_resource_votes`
--
ALTER TABLE `learning_resource_votes`
  ADD CONSTRAINT `learning_resource_votes_resource_fk` FOREIGN KEY (`resource_id`) REFERENCES `learning_resources` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `learning_resource_votes_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `plagiarism_findings`
--
ALTER TABLE `plagiarism_findings`
  ADD CONSTRAINT `plagiarism_findings_ibfk_1` FOREIGN KEY (`submission_id_a`) REFERENCES `submissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `plagiarism_findings_ibfk_2` FOREIGN KEY (`submission_id_b`) REFERENCES `submissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `plagiarism_findings_ibfk_3` FOREIGN KEY (`flagged_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `posts`
--
ALTER TABLE `posts`
  ADD CONSTRAINT `posts_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `post_reactions`
--
ALTER TABLE `post_reactions`
  ADD CONSTRAINT `post_reactions_ibfk_1` FOREIGN KEY (`post_id`) REFERENCES `posts` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `post_reactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `practice_runs`
--
ALTER TABLE `practice_runs`
  ADD CONSTRAINT `practice_runs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `practice_runs_ibfk_2` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `practice_runs_ibfk_3` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `problems`
--
ALTER TABLE `problems`
  ADD CONSTRAINT `problems_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `problem_difficulty_votes`
--
ALTER TABLE `problem_difficulty_votes`
  ADD CONSTRAINT `problem_difficulty_votes_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `problem_difficulty_votes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `problem_examples`
--
ALTER TABLE `problem_examples`
  ADD CONSTRAINT `problem_examples_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `problem_tags`
--
ALTER TABLE `problem_tags`
  ADD CONSTRAINT `problem_tags_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `problem_tags_ibfk_2` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `rating_history`
--
ALTER TABLE `rating_history`
  ADD CONSTRAINT `rating_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `rating_history_ibfk_2` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `submissions`
--
ALTER TABLE `submissions`
  ADD CONSTRAINT `submissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `submissions_ibfk_2` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `submissions_ibfk_3` FOREIGN KEY (`contest_id`) REFERENCES `contests` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `submissions_ibfk_4` FOREIGN KEY (`language_id`) REFERENCES `languages` (`id`);

--
-- Constraints for table `submission_case_results`
--
ALTER TABLE `submission_case_results`
  ADD CONSTRAINT `submission_case_results_ibfk_1` FOREIGN KEY (`submission_id`) REFERENCES `submissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `submission_case_results_ibfk_2` FOREIGN KEY (`test_case_id`) REFERENCES `test_cases` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `test_cases`
--
ALTER TABLE `test_cases`
  ADD CONSTRAINT `test_cases_ibfk_1` FOREIGN KEY (`problem_id`) REFERENCES `problems` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_badges`
--
ALTER TABLE `user_badges`
  ADD CONSTRAINT `user_badges_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_badges_ibfk_2` FOREIGN KEY (`badge_id`) REFERENCES `badges` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_stats`
--
ALTER TABLE `user_stats`
  ADD CONSTRAINT `user_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
