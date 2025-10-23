// routes/create_contest.js
const express = require("express");
const router = express.Router();
const db = require("../config/database");
const { authenticateToken, isAdmin } = require("../middleware/auth");

// ✅ Route to get all problems
router.get("/problems", authenticateToken, isAdmin, async (req, res) => {
  try {
    const [problems] = await db.execute(`
      SELECT id, title, difficulty, body_md as description
      FROM problems
      WHERE is_public = 1
      ORDER BY created_at DESC
    `);
    res.json({ success: true, problems });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch problems" });
  }
});

// Create new contest
router.post("/create-contest", authenticateToken, isAdmin, async (req, res) => {
  const { name, description, start_time, duration_hours, problem_ids } = req.body;
  if (!name || !start_time || !duration_hours || !Array.isArray(problem_ids)) {
    return res
      .status(400)
      .json({ success: false, error: "Missing required fields" });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Convert start_time to proper format and calculate end_time
    const startTime = new Date(start_time);
    const endTime = new Date(startTime.getTime() + duration_hours * 60 * 60 * 1000);

    // Insert contest into contests table
    const [result] = await conn.execute(
      `INSERT INTO contests (title, description, start_time, end_time, visibility, created_by)
       VALUES (?, ?, ?, ?, 'public', ?)`,
      [name, description || 'Contest created via admin panel', startTime, endTime, req.user.id]
    );

    const contestId = result.insertId;

    // Insert contest problems
    for (let i = 0; i < problem_ids.length; i++) {
      await conn.execute(
        `INSERT INTO contest_problems (contest_id, problem_id, display_order, points)
         VALUES (?, ?, ?, ?)`,
        [contestId, problem_ids[i], i + 1, 100]
      );
    }

    await conn.commit();
    res.json({ success: true, contest_id: contestId });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, error: "Failed to create contest: " + err.message });
  } finally {
    conn.release();
  }
});

// Fetch all contests
router.get("/fetch-contests", authenticateToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        c.*,
        TIMESTAMPDIFF(HOUR, c.start_time, c.end_time) as duration,
        (SELECT COUNT(*) FROM contest_participants cp WHERE cp.contest_id = c.id) as participant_count
      FROM contests c
      ORDER BY c.start_time DESC
    `);
    
    res.json({ contests: rows });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contests" });
  }
});

// Get active contests for users
router.get("/active", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    const now = new Date();
    
    const [contests] = await db.execute(`
      SELECT 
        c.*,
        TIMESTAMPDIFF(HOUR, c.start_time, c.end_time) as duration,
        CASE 
          WHEN cp.user_id IS NOT NULL THEN true 
          ELSE false 
        END as is_registered,
        (SELECT COUNT(*) FROM contest_participants WHERE contest_id = c.id) as participant_count
      FROM contests c
      LEFT JOIN contest_participants cp ON c.id = cp.contest_id AND cp.user_id = ?
      WHERE c.start_time <= ? AND c.end_time > ?
      ORDER BY c.start_time ASC
    `, [userId, now, now]);

    res.json({ success: true, contests });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch active contests" });
  }
});// Get upcoming contests for users
router.get("/upcoming", authenticateToken, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    const now = new Date();
    
    const [contests] = await db.execute(`
      SELECT 
        c.*,
        TIMESTAMPDIFF(HOUR, c.start_time, c.end_time) as duration,
        CASE 
          WHEN cp.user_id IS NOT NULL THEN true 
          ELSE false 
        END as is_registered,
        (SELECT COUNT(*) FROM contest_participants WHERE contest_id = c.id) as participant_count
      FROM contests c
      LEFT JOIN contest_participants cp ON c.id = cp.contest_id AND cp.user_id = ?
      WHERE c.start_time > ?
      ORDER BY c.start_time ASC
    `, [userId, now]);

    res.json({ success: true, contests });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch upcoming contests" });
  }
});

// Get contest details for users (public access)
router.get("/:id/details", authenticateToken, async (req, res) => {
  const contestId = req.params.id;
  try {
    const [contestRows] = await db.execute(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM contest_participants cp WHERE cp.contest_id = c.id) as participant_count,
        (SELECT COUNT(*) FROM contest_problems cp WHERE cp.contest_id = c.id) as total_problems
       FROM contests c WHERE c.id = ?`,
      [contestId]
    );
    
    if (!contestRows.length) {
      return res.status(404).json({ 
        success: false, 
        error: "Contest not found" 
      });
    }

    const contest = contestRows[0];
    // Calculate duration in hours
    contest.duration = Math.round(
      (new Date(contest.end_time) - new Date(contest.start_time)) / (1000 * 60 * 60)
    );

    res.json({
      success: true,
      contest: contest
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch contest details" 
    });
  }
});

// Get contest info for registered users (non-admin)
router.get("/:id/info", authenticateToken, async (req, res) => {
  try {
    const contestId = req.params.id;
    const userId = req.user.id;
    
    // Check if user is registered
    const [registration] = await db.execute(
      "SELECT * FROM contest_participants WHERE contest_id = ? AND user_id = ?",
      [contestId, userId]
    );
    
    if (registration.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: "You must be registered for this contest to access it" 
      });
    }
    
    // Get contest details
    const [contests] = await db.execute(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM contest_participants WHERE contest_id = c.id) as participant_count
      FROM contests c
      WHERE c.id = ?
    `, [contestId]);
    
    if (contests.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Contest not found" 
      });
    }
    
    res.json({
      success: true,
      contest: contests[0]
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch contest info" 
    });
  }
});

// Fetch contest details including problems (Admin only)
router.get("/:id", authenticateToken, isAdmin, async (req, res) => {
  const contestId = req.params.id;
  try {
    const [contestRows] = await db.execute(
      "SELECT * FROM contests WHERE id = ?",
      [contestId]
    );
    if (!contestRows.length)
      return res.status(404).json({ error: "Contest not found" });

    const [problemRows] = await db.execute(
      `SELECT p.id, p.title, p.slug, p.difficulty
       FROM problems p
       JOIN contest_problems cp ON p.id = cp.problem_id
       WHERE cp.contest_id = ?
       ORDER BY cp.display_order`,
      [contestId]
    );

    res.json({
      contest: contestRows[0],
      problems: problemRows,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch contest details" });
  }
});

// Delete contest
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
  const contestId = req.params.id;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    
    // Delete contest problems first
    await conn.execute("DELETE FROM contest_problems WHERE contest_id = ?", [contestId]);
    
    // Delete contest
    await conn.execute("DELETE FROM contests WHERE id = ?", [contestId]);
    
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: "Failed to delete contest" });
  } finally {
    conn.release();
  }
});

// ===== USER-FACING CONTEST ROUTES =====

// Register for a contest
router.post("/:id/register", authenticateToken, async (req, res) => {
  try {
    const contestId = req.params.id;
    const userId = req.user.id;
    
    // Check if contest exists and is upcoming
    const [contests] = await db.execute(
      "SELECT * FROM contests WHERE id = ? AND start_time > NOW()",
      [contestId]
    );
    
    if (contests.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Contest not found or registration period has ended" 
      });
    }
    
    // Check if already registered
    const [existing] = await db.execute(
      "SELECT * FROM contest_participants WHERE contest_id = ? AND user_id = ?",
      [contestId, userId]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "You are already registered for this contest" 
      });
    }
    
    // Register the user
    await db.execute(
      "INSERT INTO contest_participants (contest_id, user_id, joined_at) VALUES (?, ?, NOW())",
      [contestId, userId]
    );
    
    res.json({ 
      success: true, 
      message: "Successfully registered for the contest!" 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to register for contest" 
    });
  }
});

// Check contest status for user
router.get("/:id/status", authenticateToken, async (req, res) => {
  try {
    const contestId = req.params.id;
    const userId = req.user.id;
    
    // Check if user is registered
    const [registration] = await db.execute(
      "SELECT * FROM contest_participants WHERE contest_id = ? AND user_id = ?",
      [contestId, userId]
    );
    
    // Get contest details
    const [contests] = await db.execute(
      "SELECT * FROM contests WHERE id = ?",
      [contestId]
    );
    
    if (contests.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Contest not found" 
      });
    }
    
    const contest = contests[0];
    const now = new Date();
    const startTime = new Date(contest.start_time);
    const endTime = new Date(contest.end_time);
    
    let status = 'upcoming';
    if (now >= startTime && now <= endTime) {
      status = 'active';
    } else if (now > endTime) {
      status = 'ended';
    }
    
    res.json({
      success: true,
      is_registered: registration.length > 0,
      contest_status: status,
      contest: contest
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to check contest status" 
    });
  }
});

// Get contest problems for users
router.get("/:id/problems", authenticateToken, async (req, res) => {
  try {
    const contestId = req.params.id;
    const userId = req.user.id;
    
    // Check if user is registered for the contest
    const [registration] = await db.execute(
      "SELECT * FROM contest_participants WHERE contest_id = ? AND user_id = ?",
      [contestId, userId]
    );
    
    if (registration.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: "You must be registered for this contest to view problems" 
      });
    }
    
    // Get contest problems
    const [problems] = await db.execute(`
      SELECT p.id, p.title, p.slug, p.difficulty, p.body_md
      FROM problems p
      JOIN contest_problems cp ON p.id = cp.problem_id
      WHERE cp.contest_id = ?
      ORDER BY cp.display_order ASC
    `, [contestId]);
    res.json({ success: true, problems });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch contest problems" 
    });
  }
});

// Get contest leaderboard
router.get("/:id/leaderboard", authenticateToken, async (req, res) => {
  try {
    const contestId = req.params.id;
    
    // Get leaderboard data (placeholder for now)
    const [leaderboard] = await db.execute(`
      SELECT 
        u.username,
        u.id as user_id,
        0 as score,
        0 as problems_solved,
        NULL as last_submission
      FROM contest_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.contest_id = ?
      ORDER BY score DESC, last_submission ASC
      LIMIT 50
    `, [contestId]);
    res.json({ success: true, leaderboard });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch contest leaderboard" 
    });
  }
});

// Track contest problem submission
router.post("/:id/submit/:problemId", authenticateToken, async (req, res) => {
  try {
    const contestId = req.params.id;
    const problemId = req.params.problemId;
    const userId = req.user.id;
    const { status, score = 0 } = req.body;
    
    // Check if user is registered for the contest
    const [registration] = await db.execute(
      "SELECT * FROM contest_participants WHERE contest_id = ? AND user_id = ?",
      [contestId, userId]
    );
    
    if (registration.length === 0) {
      return res.status(403).json({ 
        success: false, 
        message: "You must be registered for this contest" 
      });
    }
    
    // Record the submission
    await db.execute(`
      INSERT INTO contest_submissions (contest_id, user_id, problem_id, status, score, submitted_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        status = VALUES(status),
        score = GREATEST(score, VALUES(score)),
        submitted_at = VALUES(submitted_at)
    `, [contestId, userId, problemId, status, score]);
    
    // Check if user has solved all problems in the contest
    const [contestProblems] = await db.execute(
      "SELECT COUNT(*) as total_problems FROM contest_problems WHERE contest_id = ?",
      [contestId]
    );
    
    const [userSolvedProblems] = await db.execute(
      "SELECT COUNT(*) as solved_problems FROM contest_submissions WHERE contest_id = ? AND user_id = ? AND status = 'Accepted'",
      [contestId, userId]
    );
    
    let allProblemsCompleted = false;
    if (userSolvedProblems[0].solved_problems === contestProblems[0].total_problems) {
      allProblemsCompleted = true;
      
      // Check if this user is the first to complete all problems
      const [firstCompletion] = await db.execute(`
        SELECT user_id, MIN(submitted_at) as completion_time 
        FROM (
          SELECT cs.user_id, MAX(cs.submitted_at) as submitted_at
          FROM contest_submissions cs
          WHERE cs.contest_id = ? AND cs.status = 'Accepted'
          GROUP BY cs.user_id
          HAVING COUNT(DISTINCT cs.problem_id) = ?
        ) as completed_users
        ORDER BY completion_time ASC
        LIMIT 1
      `, [contestId, contestProblems[0].total_problems]);
      
      if (firstCompletion.length > 0 && firstCompletion[0].user_id === userId) {
        // This user is the first to complete all problems!
        await db.execute(`
          INSERT INTO contest_achievements (contest_id, user_id, achievement_type, achieved_at)
          VALUES (?, ?, 'first_complete', NOW())
          ON DUPLICATE KEY UPDATE achieved_at = VALUES(achieved_at)
        `, [contestId, userId]);
      }
    }
    res.json({ 
      success: true, 
      message: "Submission recorded",
      allProblemsCompleted
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to record submission" 
    });
  }
});

// Get contest achievements
router.get("/:id/achievements", authenticateToken, async (req, res) => {
  try {
    const contestId = req.params.id;
    
    const [achievements] = await db.execute(`
      SELECT 
        ca.user_id,
        u.username,
        ca.achievement_type,
        ca.achieved_at
      FROM contest_achievements ca
      JOIN users u ON ca.user_id = u.id
      WHERE ca.contest_id = ?
      ORDER BY ca.achieved_at ASC
    `, [contestId]);
    
    res.json({ success: true, achievements });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch achievements" 
    });
  }
});

module.exports = router;