const axios = require('axios');
require('dotenv').config();

// Judge0 API configuration
const judge0Config = {
    baseUrl: process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com',
    headers: {
        'X-RapidAPI-Key': process.env.JUDGE0_API_KEY || 'your-rapid-api-key-here',
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
        'Content-Type': 'application/json'
    },
    timeout: 30000 // 30 seconds timeout
};

// Judge0 language mapping (if needed)
const languageMapping = {
    // Your app ID -> Judge0 ID 
    // This is already handled in your database with judge0_id
};

/**
 * Submit code to Judge0 API for execution
 * @param {string} source_code - The source code to execute
 * @param {number} language_id - The Judge0 language ID
 * @param {string} stdin - The input for the program
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The submission token
 */
async function submitCodeToJudge0(source_code, language_id, stdin, options = {}) {
    try {
        const payload = {
            source_code,
            language_id,
            stdin,
            ...options
        };

        const response = await axios.post(`${judge0Config.baseUrl}/submissions`, payload, {
            headers: judge0Config.headers,
            timeout: judge0Config.timeout
        });

        return response.data;
    } catch (error) {
        throw new Error('Code execution service unavailable');
    }
}

/**
 * Get the execution result from Judge0 API
 * @param {string} token - The submission token
 * @returns {Promise<Object>} - The execution result
 */
async function getJudge0Result(token) {
    try {
        const response = await axios.get(`${judge0Config.baseUrl}/submissions/${token}`, {
            headers: judge0Config.headers,
            timeout: judge0Config.timeout,
            params: {
                base64_encoded: false,
                fields: 'status,stdout,stderr,compile_output,message,time,memory'
            }
        });

        return response.data;
    } catch (error) {
        throw new Error('Could not retrieve code execution result');
    }
}

/**
 * Submit code and wait for result
 * @param {string} source_code - The source code to execute
 * @param {number} language_id - The Judge0 language ID
 * @param {string} stdin - The input for the program
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - The execution result
 */
async function executeWithJudge0(source_code, language_id, stdin, options = {}) {
    const submission = await submitCodeToJudge0(source_code, language_id, stdin, options);
    
    // Wait for the result to be ready (with polling)
    let result;
    let attempts = 0;
    const maxAttempts = 10;
    const pollingInterval = 1000; // 1 second
    
    while (attempts < maxAttempts) {
        // Wait before polling
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        
        // Get the result
        result = await getJudge0Result(submission.token);
        
        // Check if the execution is completed
        if (result.status && result.status.id >= 3) {
            break;
        }
        
        attempts++;
    }
    
    if (!result || result.status.id <= 2) {
        throw new Error('Code execution timed out');
    }
    
    return {
        token: submission.token,
        status: result.status,
        output: result.stdout || result.compile_output || result.message || '',
        error: result.stderr || '',
        executionTime: parseFloat(result.time) * 1000 || 0, // Convert to ms
        memoryUsed: parseFloat(result.memory) || 0
    };
}

// Language ID conversion helper (if needed)
function getJudge0LanguageId(appLanguageId) {
    // In your case, this is already stored in the database
    return appLanguageId;
}

module.exports = {
    submitCodeToJudge0,
    getJudge0Result,
    executeWithJudge0,
    getJudge0LanguageId
};