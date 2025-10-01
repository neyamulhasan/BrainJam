const express = require('express');
const router = express.Router();
const db = require('../config/database'); 

// Test route
router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Practice route works!' });
});

// Test database connection
router.get('/test-db', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT 1 as test');
        res.json({ success: true, message: 'Database connection works!' });
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fetch all public problems
router.get('/problems', async (req, res) => {
    try {
        const [rows] = await db.execute(
            `SELECT 
                p.id, 
                p.title, 
                p.slug, 
                p.difficulty, 
                p.body_md, 
                p.input_format, 
                p.output_format,
                GROUP_CONCAT(t.name SEPARATOR ', ') as topics
             FROM problems p
             LEFT JOIN problem_tags pt ON p.id = pt.problem_id
             LEFT JOIN tags t ON pt.tag_id = t.id
             WHERE p.is_public = 1
             GROUP BY p.id
             ORDER BY p.id ASC`
        );
        
        console.log('API Response sample:', rows.length > 0 ? rows[0] : 'No data');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Database error:', error);
        
        // Fallback data for testing
        const fallbackData = [
            {
                id: 1,
                title: "Sum It Up",
                slug: "sum-it-up", 
                difficulty: "Easy",
                topics: "Math",
                body_md: "Given two integers A and B, output A+B.",
                input_format: "Two space-separated integers",
                output_format: "One integer: A+B"
            },
            {
                id: 2,
                title: "Balanced Brackets",
                slug: "balanced-brackets",
                difficulty: "Medium", 
                topics: "Stack, Greedy",
                body_md: "Check if a string of brackets is balanced.",
                input_format: "String of brackets",
                output_format: "YES or NO"
            },
            {
                id: 3,
                title: "Shortest Path", 
                slug: "shortest-path",
                difficulty: "Hard",
                topics: "graphs",
                body_md: "Find shortest path in unweighted graph.",
                input_format: "Graph edges",
                output_format: "Shortest distance"
            },
            {
                id: 4,
                title: "Two Sum",
                slug: "two-sum", 
                difficulty: "Easy",
                topics: "Array, Hash Table",
                body_md: "Find two numbers that add up to target.",
                input_format: "Array and target",
                output_format: "Indices of the two numbers"
            }
        ];
        
        console.log('Using fallback data due to database error');
        res.json({ success: true, data: fallbackData });
    }
});

// Fetch specific problem details
router.get('/problems/:id', async (req, res) => {
    try {
        const problemId = req.params.id;
        console.log(`Fetching problem with ID: ${problemId}`);
        
        const [rows] = await db.execute(
            `SELECT id, title, slug, difficulty, body_md, input_format, output_format, constraints_md
             FROM problems 
             WHERE id = ? AND is_public = 1`,
            [problemId]
        );
        
        console.log(`Found ${rows.length} problems`);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Problem not found' });
        }
        
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching problem:', error);
        res.status(500).json({ success: false, error: 'Database query failed: ' + error.message });
    }
});

// Fetch problem examples
router.get('/problems/:id/examples', async (req, res) => {
    try {
        const problemId = req.params.id;
        const [rows] = await db.execute(
            `SELECT id, example_order, input_text, output_text, explanation
             FROM problem_examples 
             WHERE problem_id = ?
             ORDER BY example_order ASC`,
            [problemId]
        );
        
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Database query failed' });
    }
});

// Test solution endpoint (placeholder)
router.post('/test-solution', async (req, res) => {
    try {
        // This would integrate with a code execution service
        // For now, return a mock response
        res.json({ 
            success: true, 
            data: {
                status: 'completed',
                message: 'Test functionality not implemented yet'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Test failed' });
    }
});

// Submit solution endpoint (placeholder)
router.post('/submit-solution', async (req, res) => {
    try {
        // This would save the solution and run it against test cases
        // For now, return a mock response
        res.json({ 
            success: true, 
            data: {
                submissionId: Date.now(),
                status: 'accepted',
                message: 'Submission functionality not implemented yet'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Submission failed' });
    }
});

module.exports = router;
