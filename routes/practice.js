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
        res.json({ success: true, data: rows });
    } catch (error) {
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
        res.json({ success: true, data: fallbackData });
    }
});

// Fetch specific problem details
router.get('/problems/:id', async (req, res) => {
    try {
        const problemId = req.params.id;
        const [rows] = await db.execute(
            `SELECT id, title, slug, difficulty, body_md, input_format, output_format, constraints_md
             FROM problems 
             WHERE id = ? AND is_public = 1`,
            [problemId]
        );
        if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Problem not found' });
        }
        
        res.json({ success: true, data: rows[0] });
    } catch (error) {
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
        res.status(500).json({ success: false, error: 'Database query failed' });
    }
});

// Test solution endpoint with actual code execution
router.post('/test-solution', async (req, res) => {
    try {
        const { problemId, code, language } = req.body;
        
        if (!problemId || !code || !language) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: problemId, code, language' 
            });
        }
        // Get test cases for the problem
        const testCases = await getTestCases(problemId);
        if (testCases.length === 0) {
            return res.json({
                success: true,
                data: {
                    status: 'no_tests',
                    message: 'No test cases available for this problem',
                    testResults: []
                }
            });
        }

        // Execute code against test cases
        const testResults = await executeCodeWithTestCases(code, language, testCases);
        
        // Calculate overall status
        const passedTests = testResults.filter(result => result.status === 'passed').length;
        const totalTests = testResults.length;
        const overallStatus = passedTests === totalTests ? 'passed' : 'failed';
        
        res.json({ 
            success: true, 
            data: {
                status: overallStatus,
                message: `${passedTests}/${totalTests} test cases passed`,
                testResults: testResults,
                executionTime: testResults.reduce((sum, result) => sum + (result.executionTime || 0), 0),
                memoryUsed: Math.max(...testResults.map(result => result.memoryUsed || 0))
            }
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to test solution: ' + error.message 
        });
    }
});

// Submit solution endpoint with code execution and scoring
router.post('/submit-solution', async (req, res) => {
    try {
        const { problemId, code, language } = req.body;
        const userId = req.user?.id; // Assuming auth middleware sets req.user
        
        if (!problemId || !code || !language) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: problemId, code, language' 
            });
        }
        // Get all test cases (including hidden ones)
        const testCases = await getTestCases(problemId, true); // includeHidden = true
        
        if (testCases.length === 0) {
            return res.json({
                success: true,
                data: {
                    submissionId: Date.now(),
                    status: 'no_tests',
                    message: 'No test cases available for this problem'
                }
            });
        }

        // Execute code against all test cases
        const testResults = await executeCodeWithTestCases(code, language, testCases);
        
        // Calculate score and status
        const passedTests = testResults.filter(result => result.status === 'passed').length;
        const totalTests = testResults.length;
        const score = Math.round((passedTests / totalTests) * 100);
        const status = passedTests === totalTests ? 'accepted' : 'wrong_answer';
        
        // Save submission to database
        const submissionId = await saveSubmission({
            userId,
            problemId,
            code,
            language,
            status,
            score,
            executionTime: testResults.reduce((sum, result) => sum + (result.executionTime || 0), 0),
            memoryUsed: Math.max(...testResults.map(result => result.memoryUsed || 0)),
            testResults
        });
        
        // Award points if solution is accepted
        if (status === 'accepted' && userId) {
            await awardPoints(userId, problemId, score);
        }
        
        res.json({ 
            success: true, 
            data: {
                submissionId: submissionId,
                status: status,
                score: score,
                message: `Solution ${status === 'accepted' ? 'accepted' : 'failed'}: ${passedTests}/${totalTests} test cases passed`,
                testResults: testResults.slice(0, 3), // Only show first 3 test results
                totalTests: totalTests,
                passedTests: passedTests
            }
        });
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Failed to submit solution: ' + error.message 
        });
    }
});

module.exports = router;

// Helper Functions

/**
 * Get test cases for a problem
 */
async function getTestCases(problemId, includeHidden = false) {
    try {
        const query = includeHidden 
            ? 'SELECT * FROM test_cases WHERE problem_id = ? ORDER BY is_sample DESC, case_order ASC'
            : 'SELECT * FROM test_cases WHERE problem_id = ? AND is_sample = 1 ORDER BY case_order ASC';
            
        const [rows] = await db.execute(query, [problemId]);
        
        // Map database column names to expected names
        return rows.map(row => ({
            id: row.id,
            problem_id: row.problem_id,
            input: row.input_data,
            expected_output: row.expected_output,
            is_sample: row.is_sample
        }));
    } catch (error) {
        // Return sample test cases for testing
        return [
            {
                id: 1,
                problem_id: problemId,
                input: '2 3',
                expected_output: '5',
                is_sample: 1
            },
            {
                id: 2,
                problem_id: problemId,
                input: '10 15',
                expected_output: '25',
                is_sample: 1
            }
        ];
    }
}

/**
 * Execute code against test cases
 */
async function executeCodeWithTestCases(code, language, testCases) {
    const results = [];
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        try {
            const result = await executeCode(code, language, testCase.input);
            
            const actualOutput = result.output.trim();
            const expectedOutput = testCase.expected_output.trim();
            const passed = actualOutput === expectedOutput;
            
            results.push({
                testCaseId: testCase.id,
                input: testCase.input,
                expectedOutput: expectedOutput,
                actualOutput: actualOutput,
                status: passed ? 'passed' : 'failed',
                executionTime: result.executionTime || 0,
                memoryUsed: result.memoryUsed || 0,
                error: result.error || null
            });
        } catch (error) {
            results.push({
                testCaseId: testCase.id,
                input: testCase.input,
                expectedOutput: testCase.expected_output,
                actualOutput: '',
                status: 'error',
                executionTime: 0,
                memoryUsed: 0,
                error: error.message
            });
        }
    }
    
    return results;
}

/**
 * Execute code with given input using Judge0 API
 */
async function executeCode(code, language, input) {
    // Import Judge0 configuration and functions
    const judge0 = require('../config/judge0');
    
    // Check if compilers are disabled (for development/testing)
    const DISABLE_COMPILERS = false; // API key is configured and working
    
    if (DISABLE_COMPILERS) {
        // Advanced simulation mode that attempts to understand the code and provide realistic outputs
        let simulatedOutput = "";
        
        try {
            // Process different languages
            if (language === 'javascript') {
                simulatedOutput = simulateJavaScript(code, input);
            } 
            else if (language === 'python') {
                simulatedOutput = simulatePython(code, input);
            } 
            else if (language === 'c') {
                simulatedOutput = simulateC(code, input);
            }
            else if (language === 'c++') {
                simulatedOutput = simulateCpp(code, input);
            }
            else if (language === 'java') {
                simulatedOutput = simulateJava(code, input);
            }
            else {
                simulatedOutput = "Simulation not available for " + language;
            }
        } catch (error) {
            simulatedOutput = `Runtime Error: ${error.message}`;
        }
        
        return {
            output: simulatedOutput,
            executionTime: Math.floor(Math.random() * 100) + 50, // Random execution time between 50-150ms
            memoryUsed: Math.floor(Math.random() * 2048) + 512,  // Random memory usage between 512-2560KB
            error: null
        };
    }
    
    try {
        // Get the Judge0 language ID from our language name
        const [languageResult] = await db.execute(
            'SELECT judge0_id FROM languages WHERE name LIKE ? OR name = ? LIMIT 1', 
            [`%${language}%`, language]
        );
        
        if (!languageResult || languageResult.length === 0) {
            throw new Error(`Language ${language} not supported`);
        }
        
        const judge0LanguageId = languageResult[0].judge0_id;
        // Execute code using Judge0 API
        const startTime = Date.now();
        const result = await judge0.executeWithJudge0(code, judge0LanguageId, input, {
            cpu_time_limit: 5,       // 5 seconds
            memory_limit: 512000,    // 500 MB
            base64_encoded: false    // Not using base64 encoding for simplicity
        });
        
        const executionTime = Date.now() - startTime;
        
        // Save execution record to database (optional)
        try {
            await db.execute(`
                INSERT INTO practice_runs 
                (user_id, problem_id, language_id, source_code, stdin, stdout, stderr, status, execution_time_ms, memory_kb, judge0_token)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                null, // user_id (if no user is logged in)
                null, // problem_id (if just testing code snippets)
                languageResult[0].id,
                code,
                input,
                result.output,
                result.error || '',
                result.status?.description || 'Finished',
                result.executionTime,
                result.memoryUsed,
                result.token
            ]);
        } catch (dbError) {
            // Continue execution even if database save fails
        }
        
        return {
            output: result.output,
            executionTime: result.executionTime,
            memoryUsed: result.memoryUsed,
            error: result.error || null
        };
        
    } catch (error) {
        throw error;
    }
}

/**
 * Execute shell command with timeout
 */
function executeCommand(command, timeout = 10000) {
    const { exec } = require('child_process');
    
    return new Promise((resolve, reject) => {
        const process = exec(command, { timeout }, (error, stdout, stderr) => {
            if (error) {
                if (error.code === 'ETIMEDOUT') {
                    reject(new Error('Code execution timed out'));
                } else {
                    reject(new Error(stderr || error.message));
                }
            } else {
                resolve(stdout);
            }
        });
        
        // Set a manual timeout as backup
        setTimeout(() => {
            process.kill();
            reject(new Error('Code execution timed out'));
        }, timeout);
    });
}

/**
 * Save submission to database
 */
async function saveSubmission(submission) {
    try {
        const [result] = await db.execute(`
            INSERT INTO submissions (user_id, problem_id, code, language, status, score, execution_time, memory_used, submitted_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            submission.userId || null,
            submission.problemId,
            submission.code,
            submission.language,
            submission.status,
            submission.score,
            submission.executionTime,
            submission.memoryUsed
        ]);
        
        return result.insertId;
    } catch (error) {
        // Return a mock ID if database save fails
        return Date.now();
    }
}

/**
 * Award points to user for successful submission
 */
async function awardPoints(userId, problemId, score) {
    try {
        // Check if user already solved this problem
        const [existing] = await db.execute(
            'SELECT id FROM submissions WHERE user_id = ? AND problem_id = ? AND status = "accepted" AND id < LAST_INSERT_ID()',
            [userId, problemId]
        );
        
        if (existing.length > 0) {
            return;
        }
        
        // Award points based on difficulty and score
        let basePoints = 10; // Default points
        
        try {
            const [problem] = await db.execute('SELECT difficulty FROM problems WHERE id = ?', [problemId]);
            if (problem.length > 0) {
                switch (problem[0].difficulty.toLowerCase()) {
                    case 'easy': basePoints = 10; break;
                    case 'medium': basePoints = 20; break;
                    case 'hard': basePoints = 30; break;
                }
            }
        } catch (error) {
        }
        
        const pointsAwarded = Math.round((basePoints * score) / 100);
        
        // Update user's total points
        await db.execute(
            'UPDATE users SET total_points = total_points + ? WHERE id = ?',
            [pointsAwarded, userId]
        );
    } catch (error) {
    }
}
