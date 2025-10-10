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

        console.log(`Testing solution for problem ${problemId} in ${language}`);
        
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
        console.error('Error testing solution:', error);
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

        console.log(`Submitting solution for problem ${problemId} by user ${userId}`);
        
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
        console.error('Error submitting solution:', error);
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
        console.error('Error fetching test cases:', error);
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
        console.log(`Running test case ${i + 1}: Input="${testCase.input}"`);
        
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
            
            console.log(`Test case ${i + 1}: ${passed ? 'PASSED' : 'FAILED'}`);
            
        } catch (error) {
            console.error(`Test case ${i + 1} execution error:`, error);
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
 * Execute code with given input (simplified execution for demonstration)
 */
async function executeCode(code, language, input) {
    // This is a simplified implementation
    // In production, you would use Docker containers or a sandboxed environment
    
    const fs = require('fs').promises;
    const { exec } = require('child_process');
    const path = require('path');
    const crypto = require('crypto');
    
    // Create unique filename
    const uniqueId = crypto.randomBytes(16).toString('hex');
    const tempDir = path.join(__dirname, '../temp');
    
    // Ensure temp directory exists
    try {
        await fs.mkdir(tempDir, { recursive: true });
    } catch (error) {
        // Directory might already exist
    }
    
    const startTime = Date.now();
    
    try {
        let filename, compileCmd, runCmd;
        
        switch (language.toLowerCase()) {
            case 'python':
                filename = path.join(tempDir, `solution_${uniqueId}.py`);
                await fs.writeFile(filename, code);
                runCmd = `echo "${input}" | python3 "${filename}"`;
                break;
                
            case 'javascript':
                filename = path.join(tempDir, `solution_${uniqueId}.js`);
                // Wrap code to read from stdin
                const jsCode = `
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let inputLines = [];
rl.on('line', (line) => {
    inputLines.push(line);
});

rl.on('close', () => {
    const input = inputLines.join('\\n');
    ${code}
});
`;
                await fs.writeFile(filename, jsCode);
                runCmd = `echo "${input}" | node "${filename}"`;
                break;
                
            case 'cpp':
                filename = path.join(tempDir, `solution_${uniqueId}.cpp`);
                const executableName = path.join(tempDir, `solution_${uniqueId}`);
                await fs.writeFile(filename, code);
                compileCmd = `g++ -o "${executableName}" "${filename}"`;
                runCmd = `echo "${input}" | "${executableName}"`;
                break;
                
            case 'java':
                filename = path.join(tempDir, `Solution_${uniqueId}.java`);
                // Modify code to use the correct class name
                const javaCode = code.replace(/public\s+class\s+\w+/g, `public class Solution_${uniqueId}`);
                await fs.writeFile(filename, javaCode);
                compileCmd = `javac "${filename}"`;
                runCmd = `echo "${input}" | java -cp "${tempDir}" Solution_${uniqueId}`;
                break;
                
            default:
                throw new Error(`Language ${language} not supported`);
        }
        
        // Compile if needed
        if (compileCmd) {
            await executeCommand(compileCmd);
        }
        
        // Run the code
        const output = await executeCommand(runCmd, 5000); // 5 second timeout
        const executionTime = Date.now() - startTime;
        
        // Clean up files
        try {
            await fs.unlink(filename);
            if (language.toLowerCase() === 'cpp') {
                await fs.unlink(path.join(tempDir, `solution_${uniqueId}`));
            }
            if (language.toLowerCase() === 'java') {
                await fs.unlink(path.join(tempDir, `Solution_${uniqueId}.class`));
            }
        } catch (cleanupError) {
            console.warn('Cleanup error:', cleanupError.message);
        }
        
        return {
            output: output.trim(),
            executionTime: executionTime,
            memoryUsed: 1024, // Mock memory usage
            error: null
        };
        
    } catch (error) {
        // Clean up files on error
        try {
            await fs.unlink(filename);
        } catch (cleanupError) {
            // Ignore cleanup errors
        }
        
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
        console.error('Error saving submission:', error);
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
            console.log('User already solved this problem, no additional points awarded');
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
            console.warn('Could not fetch problem difficulty:', error.message);
        }
        
        const pointsAwarded = Math.round((basePoints * score) / 100);
        
        // Update user's total points
        await db.execute(
            'UPDATE users SET total_points = total_points + ? WHERE id = ?',
            [pointsAwarded, userId]
        );
        
        console.log(`Awarded ${pointsAwarded} points to user ${userId} for problem ${problemId}`);
        
    } catch (error) {
        console.error('Error awarding points:', error);
    }
}
