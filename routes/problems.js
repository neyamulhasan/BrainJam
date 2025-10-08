const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Temporarily bypass authentication for debugging
// router.use(authenticateToken);
// router.use(isAdmin);
console.log('WARNING: Authentication temporarily disabled for debugging');

/**
 * Test route to verify database connection
 */
router.get('/test', async (req, res) => {
    try {
        console.log('Testing database connection...');
        const [result] = await db.execute('SELECT 1 as test');
        return res.json({ 
            success: true, 
            message: 'Database connection successful',
            result: result 
        });
    } catch (error) {
        console.error('Database connection test failed:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Database connection failed: ' + error.message 
        });
    }
});

/**
 * GET /api/problems
 * Get all problems (admin access)
 */
router.get('/', async (req, res) => {
    try {
        console.log('GET /api/problems - Starting to fetch all problems');
        
        // First check if we can execute a simple query
        try {
            const [testResult] = await db.execute('SELECT 1 as test');
            console.log('Database connection test successful:', testResult);
        } catch (dbError) {
            console.error('Database connection test failed:', dbError);
            return res.status(500).json({ 
                success: false, 
                error: 'Database connection failed: ' + dbError.message 
            });
        }
        
        // Fetch all problems
        console.log('Executing SQL query for problems...');
        const [problems] = await db.execute(`
            SELECT 
                p.id, p.title, p.body_md as description, p.difficulty, 
                p.time_limit_ms as time_limit, p.memory_limit_kb as memory_limit, 
                p.created_at, p.created_at as updated_at
            FROM problems p
            ORDER BY p.created_at DESC
        `);
        console.log(`Found ${problems.length} problems in database`);

        // Get tags for each problem
        console.log('Starting to fetch tags for each problem...');
        for (const problem of problems) {
            const [tags] = await db.execute(`
                SELECT t.id, t.name
                FROM tags t
                JOIN problem_tags pt ON t.id = pt.tag_id
                WHERE pt.problem_id = ?
            `, [problem.id]);
            
            problem.tags = tags;
            console.log(`Found ${tags.length} tags for problem ${problem.id}`);
            
            // Get count of test cases
            console.log(`Fetching test case count for problem ${problem.id}...`);
            const [testCasesCount] = await db.execute(`
                SELECT COUNT(*) as count
                FROM problem_examples
                WHERE problem_id = ?
            `, [problem.id]);
            
            problem.test_cases_count = testCasesCount[0].count;
            console.log(`Problem ${problem.id} has ${problem.test_cases_count} test cases`);
        }

        console.log('Successfully processed all problems, sending response');
        res.json({
            success: true,
            data: problems
        });

    } catch (error) {
        console.error('Error fetching problems:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState,
            sql: error.sql
        });
        
        res.status(500).json({
            success: false,
            error: 'Failed to fetch problems: ' + error.message
        });
    }
});

/**
 * GET /api/problems/:id
 * Get a specific problem by ID (admin access)
 */
router.get('/:id', [
    param('id').isInt().withMessage('Problem ID must be an integer')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const problemId = req.params.id;

        // Fetch problem details
        const [problems] = await db.execute(`
            SELECT 
                p.id, p.title, p.description, p.difficulty, 
                p.time_limit, p.memory_limit, p.created_at, p.updated_at
            FROM problems p
            WHERE p.id = ?
        `, [problemId]);

        if (problems.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Problem not found'
            });
        }

        const problem = problems[0];

        // Get tags for the problem
        const [tags] = await db.execute(`
            SELECT pt.id, pt.name
            FROM problem_tags pt
            JOIN problem_tag_mapping ptm ON pt.id = ptm.tag_id
            WHERE ptm.problem_id = ?
        `, [problemId]);
        
        problem.tags = tags;

        // Get test cases for the problem
        const [testCases] = await db.execute(`
            SELECT id, input_text as input, output_text as output, is_hidden, is_example
            FROM problem_examples
            WHERE problem_id = ?
            ORDER BY id ASC
        `, [problemId]);
        
        problem.test_cases = testCases;

        res.json({
            success: true,
            data: problem
        });

    } catch (error) {
        console.error('Error fetching problem details:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch problem details'
        });
    }
});

/**
 * POST /api/problems
 * Create a new problem (admin access)
 */
router.post('/', [
    body('title').isString().trim().isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    body('description').isString().trim().notEmpty()
        .withMessage('Description is required'),
    body('difficulty').isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard'),
    body('time_limit').isFloat({ min: 0.1, max: 10 })
        .withMessage('Time limit must be between 0.1 and 10 seconds'),
    body('memory_limit').isInt({ min: 1, max: 512 })
        .withMessage('Memory limit must be between 1 and 512 MB'),
    body('tags').isArray()
        .withMessage('Tags must be an array'),
    body('test_cases').isArray({ min: 1 })
        .withMessage('At least one test case is required'),
    body('test_cases.*.input').isString().notEmpty()
        .withMessage('Test case input is required'),
    body('test_cases.*.output').isString().notEmpty()
        .withMessage('Test case output is required'),
    body('test_cases.*.is_hidden').isBoolean()
        .withMessage('is_hidden must be a boolean')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { title, description, difficulty, time_limit, memory_limit, tags, test_cases } = req.body;

        // Start a transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Create problem
            const [result] = await connection.execute(`
                INSERT INTO problems (title, description, difficulty, time_limit, memory_limit)
                VALUES (?, ?, ?, ?, ?)
            `, [title, description, difficulty, time_limit, memory_limit]);

            const problemId = result.insertId;

            // Process tags
            for (const tagName of tags) {
                // Check if tag exists
                const [existingTags] = await connection.execute(`
                    SELECT id FROM problem_tags WHERE name = ?
                `, [tagName]);

                let tagId;
                
                if (existingTags.length > 0) {
                    // Tag exists
                    tagId = existingTags[0].id;
                } else {
                    // Create new tag
                    const [newTag] = await connection.execute(`
                        INSERT INTO problem_tags (name) VALUES (?)
                    `, [tagName]);
                    
                    tagId = newTag.insertId;
                }

                // Create mapping
                await connection.execute(`
                    INSERT INTO problem_tag_mapping (problem_id, tag_id)
                    VALUES (?, ?)
                `, [problemId, tagId]);
            }

            // Process test cases
            for (const testCase of test_cases) {
                const isExample = !testCase.is_hidden;
                
                await connection.execute(`
                    INSERT INTO problem_examples (problem_id, input_text, output_text, is_hidden, is_example)
                    VALUES (?, ?, ?, ?, ?)
                `, [problemId, testCase.input, testCase.output, testCase.is_hidden, isExample]);
            }

            // Commit transaction
            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Problem created successfully',
                data: { id: problemId }
            });

        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error creating problem:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create problem'
        });
    }
});

/**
 * PUT /api/problems/:id
 * Update an existing problem (admin access)
 */
router.put('/:id', [
    param('id').isInt().withMessage('Problem ID must be an integer'),
    body('title').isString().trim().isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),
    body('description').isString().trim().notEmpty()
        .withMessage('Description is required'),
    body('difficulty').isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard'),
    body('time_limit').isFloat({ min: 0.1, max: 10 })
        .withMessage('Time limit must be between 0.1 and 10 seconds'),
    body('memory_limit').isInt({ min: 1, max: 512 })
        .withMessage('Memory limit must be between 1 and 512 MB'),
    body('tags').isArray()
        .withMessage('Tags must be an array'),
    body('test_cases').isArray({ min: 1 })
        .withMessage('At least one test case is required'),
    body('test_cases.*.input').isString().notEmpty()
        .withMessage('Test case input is required'),
    body('test_cases.*.output').isString().notEmpty()
        .withMessage('Test case output is required'),
    body('test_cases.*.is_hidden').isBoolean()
        .withMessage('is_hidden must be a boolean')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const problemId = req.params.id;
        const { title, description, difficulty, time_limit, memory_limit, tags, test_cases } = req.body;

        // Check if problem exists
        const [problems] = await db.execute(`
            SELECT id FROM problems WHERE id = ?
        `, [problemId]);

        if (problems.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Problem not found'
            });
        }

        // Start a transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Update problem
            await connection.execute(`
                UPDATE problems
                SET title = ?, description = ?, difficulty = ?, time_limit = ?, memory_limit = ?, updated_at = NOW()
                WHERE id = ?
            `, [title, description, difficulty, time_limit, memory_limit, problemId]);

            // Delete existing tag mappings
            await connection.execute(`
                DELETE FROM problem_tag_mapping
                WHERE problem_id = ?
            `, [problemId]);

            // Process tags
            for (const tagName of tags) {
                // Check if tag exists
                const [existingTags] = await connection.execute(`
                    SELECT id FROM problem_tags WHERE name = ?
                `, [tagName]);

                let tagId;
                
                if (existingTags.length > 0) {
                    // Tag exists
                    tagId = existingTags[0].id;
                } else {
                    // Create new tag
                    const [newTag] = await connection.execute(`
                        INSERT INTO problem_tags (name) VALUES (?)
                    `, [tagName]);
                    
                    tagId = newTag.insertId;
                }

                // Create mapping
                await connection.execute(`
                    INSERT INTO problem_tag_mapping (problem_id, tag_id)
                    VALUES (?, ?)
                `, [problemId, tagId]);
            }

            // Process test cases
            // First, get existing test case IDs
            const [existingTestCases] = await connection.execute(`
                SELECT id FROM problem_examples WHERE problem_id = ?
            `, [problemId]);

            const existingTestCaseIds = existingTestCases.map(tc => tc.id);
            const updatedTestCaseIds = test_cases.filter(tc => tc.id).map(tc => Number(tc.id));
            
            // Delete test cases that are not in the updated list
            const testCasesToDelete = existingTestCaseIds.filter(id => !updatedTestCaseIds.includes(id));
            
            if (testCasesToDelete.length > 0) {
                await connection.execute(`
                    DELETE FROM problem_examples
                    WHERE id IN (?)
                `, [testCasesToDelete]);
            }

            // Update or create test cases
            for (const testCase of test_cases) {
                const isExample = !testCase.is_hidden;
                
                if (testCase.id) {
                    // Update existing test case
                    await connection.execute(`
                        UPDATE problem_examples
                        SET input_text = ?, output_text = ?, is_hidden = ?, is_example = ?
                        WHERE id = ? AND problem_id = ?
                    `, [testCase.input, testCase.output, testCase.is_hidden, isExample, testCase.id, problemId]);
                } else {
                    // Create new test case
                    await connection.execute(`
                        INSERT INTO problem_examples (problem_id, input_text, output_text, is_hidden, is_example)
                        VALUES (?, ?, ?, ?, ?)
                    `, [problemId, testCase.input, testCase.output, testCase.is_hidden, isExample]);
                }
            }

            // Commit transaction
            await connection.commit();

            res.json({
                success: true,
                message: 'Problem updated successfully',
                data: { id: problemId }
            });

        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error updating problem:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update problem'
        });
    }
});

/**
 * DELETE /api/problems/:id
 * Delete a problem (admin access)
 */
router.delete('/:id', [
    param('id').isInt().withMessage('Problem ID must be an integer')
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const problemId = req.params.id;

        // Check if problem exists
        const [problems] = await db.execute(`
            SELECT id FROM problems WHERE id = ?
        `, [problemId]);

        if (problems.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Problem not found'
            });
        }

        // Start a transaction
        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            // Delete test cases
            await connection.execute(`
                DELETE FROM problem_examples
                WHERE problem_id = ?
            `, [problemId]);

            // Delete tag mappings
            await connection.execute(`
                DELETE FROM problem_tag_mapping
                WHERE problem_id = ?
            `, [problemId]);

            // Delete submissions (if they exist)
            await connection.execute(`
                DELETE FROM submissions
                WHERE problem_id = ?
            `, [problemId]);

            // Delete problem
            await connection.execute(`
                DELETE FROM problems
                WHERE id = ?
            `, [problemId]);

            // Commit transaction
            await connection.commit();

            res.json({
                success: true,
                message: 'Problem deleted successfully'
            });

        } catch (error) {
            // Rollback transaction on error
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error deleting problem:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete problem'
        });
    }
});

/**
 * GET /api/problems/tags
 * Get all problem tags (admin access)
 */
router.get('/tags', async (req, res) => {
    try {
        // Fetch all tags
        const [tags] = await db.execute(`
            SELECT id, name
            FROM tags
            ORDER BY name ASC
        `);

        res.json({
            success: true,
            data: tags
        });

    } catch (error) {
        console.error('Error fetching problem tags:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch problem tags'
        });
    }
});

module.exports = router;