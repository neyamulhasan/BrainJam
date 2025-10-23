document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const problemId = urlParams.get('id');
    
    if (!problemId) {
        showError('No problem ID specified');
        return;
    }

    await loadProblemDetails(problemId);
    initializeSubmissionForm();
});

async function loadProblemDetails(problemId) {
    const loadingOverlay = document.getElementById('loading-overlay');
    
    try {
        // Show loading overlay
        loadingOverlay.style.display = 'flex';
        
        // Fetch problem details and examples
        const [problemResponse, examplesResponse] = await Promise.all([
            fetch(`/api/practice/problems/${problemId}`),
            fetch(`/api/practice/problems/${problemId}/examples`)
        ]);
        if (!problemResponse.ok) {
            const errorText = await problemResponse.text();
            throw new Error(`Failed to fetch problem details: ${problemResponse.status}`);
        }

        const problemData = await problemResponse.json();
        const examplesData = await examplesResponse.json();
        if (!problemData.success) {
            throw new Error(problemData.error || 'Failed to load problem');
        }

        const problem = problemData.data;
        const examples = examplesData.success ? examplesData.data : [];

        // Populate problem details
        populateProblemDetails(problem, examples);
        
    } catch (error) {
        showError(`Failed to load problem details: ${error.message}. Please check if the database is connected and has sample data.`);
        
        // Show a fallback message
        populateFallbackContent(problemId);
    } finally {
        // Hide loading overlay
        loadingOverlay.style.display = 'none';
    }
}

function populateProblemDetails(problem, examples) {
    // Set problem title and meta information
    document.getElementById('problem-title').textContent = problem.title;
    document.getElementById('problem-id').textContent = `Problem #${problem.id}`;
    
    // Set difficulty
    const difficultyElement = document.getElementById('problem-difficulty');
    difficultyElement.textContent = problem.difficulty;
    difficultyElement.className = `difficulty-tag ${problem.difficulty.toLowerCase()}`;
    
    // Set problem description (render markdown)
    const descriptionElement = document.getElementById('problem-description');
    descriptionElement.innerHTML = marked.parse(problem.body_md);
    
    // Set input/output formats
    document.getElementById('input-format-content').textContent = 
        problem.input_format || 'No input format specified';
    document.getElementById('output-format-content').textContent = 
        problem.output_format || 'No output format specified';
    
    // Set constraints if available
    if (problem.constraints_md) {
        const constraintsSection = document.getElementById('constraints-section');
        const constraintsContent = document.getElementById('constraints-content');
        constraintsContent.innerHTML = marked.parse(problem.constraints_md);
        constraintsSection.style.display = 'block';
    }
    
    // Populate examples
    populateExamples(examples);
    
    // Update page title
    document.title = `${problem.title} - BrainJam`;
}

function populateExamples(examples) {
    const examplesContainer = document.getElementById('examples-container');
    
    if (!examples || examples.length === 0) {
        examplesContainer.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">No examples available for this problem.</p>';
        return;
    }
    
    examplesContainer.innerHTML = '';
    
    examples.forEach((example, index) => {
        const exampleElement = document.createElement('div');
        exampleElement.className = 'example';
        
        exampleElement.innerHTML = `
            <div class="example-header">
                Example ${index + 1}
            </div>
            <div class="example-content">
                <div class="example-input">
                    <h4>Input</h4>
                    <pre>${escapeHtml(example.input_text)}</pre>
                </div>
                <div class="example-output">
                    <h4>Output</h4>
                    <pre>${escapeHtml(example.output_text)}</pre>
                </div>
                ${example.explanation ? `
                    <div class="example-explanation">
                        <p><strong>Explanation:</strong> ${escapeHtml(example.explanation)}</p>
                    </div>
                ` : ''}
            </div>
        `;
        
        examplesContainer.appendChild(exampleElement);
    });
}

function initializeSubmissionForm() {
    const fileInput = document.getElementById('solution-file');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file');
    const codeInput = document.getElementById('code-input');
    const testSolutionBtn = document.getElementById('test-solution');
    const submitSolutionBtn = document.getElementById('submit-solution');
    const languageSelect = document.getElementById('language');
    const codeFileName = document.getElementById('code-file-name');
    const lineNumbers = document.getElementById('line-numbers');
    
    // Language file extensions and default code templates
    const languageConfig = {
        cpp: {
            extension: '.cpp',
            template: `// Write your solution here...
#include <iostream>
using namespace std;

int main() {
    // Your code here
    return 0;
}`
        },
        java: {
            extension: '.java',
            template: `// Write your solution here...
public class Solution {
    public static void main(String[] args) {
        // Your code here
    }
}`
        },
        python: {
            extension: '.py',
            template: `# Write your solution here...
def main():
    # Your code here
    pass

if __name__ == "__main__":
    main()`
        },
        javascript: {
            extension: '.js',
            template: `// Write your solution here...
function main() {
    // Your code here
}

main();`
        },
        c: {
            extension: '.c',
            template: `// Write your solution here...
#include <stdio.h>

int main() {
    // Your code here
    return 0;
}`
        }
    };
    
    // Update line numbers
    function updateLineNumbers() {
        const lines = codeInput.value.split('\n').length;
        const numbers = [];
        for (let i = 1; i <= Math.max(lines, 20); i++) {
            numbers.push(i.toString().padStart(2, ' ')); // Right-align with padding
        }
        lineNumbers.textContent = numbers.join('\n');
    }
    
    // Update file name and template based on language
    languageSelect.addEventListener('change', function() {
        const language = this.value;
        const config = languageConfig[language];
        if (config) {
            codeFileName.textContent = `solution${config.extension}`;
            // Always update the template when language changes
            codeInput.value = config.template;
            updateLineNumbers();
        }
    });
    
    // Update line numbers on input
    codeInput.addEventListener('input', updateLineNumbers);
    codeInput.addEventListener('scroll', function() {
        lineNumbers.scrollTop = this.scrollTop;
    });
    
    // Initialize line numbers and template
    updateLineNumbers();
    if (languageSelect.value) {
        const config = languageConfig[languageSelect.value];
        if (config) {
            codeFileName.textContent = `solution${config.extension}`;
            codeInput.value = config.template;
            updateLineNumbers();
        }
    }
    
    // File upload handling
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            fileName.textContent = file.name;
            fileInfo.style.display = 'flex';
            
            // Read file content and populate textarea
            const reader = new FileReader();
            reader.onload = function(e) {
                codeInput.value = e.target.result;
            };
            reader.readAsText(file);
        }
    });
    
    // Remove file
    removeFileBtn.addEventListener('click', function() {
        fileInput.value = '';
        fileInfo.style.display = 'none';
        codeInput.value = '';
    });
    
    // Test solution
    testSolutionBtn.addEventListener('click', function() {
        const code = codeInput.value.trim();
        const language = document.getElementById('language').value;
        
        if (!code) {
            showError('Please provide your solution code');
            return;
        }
        
        testSolution(code, language);
    });
    
    // Submit solution
    submitSolutionBtn.addEventListener('click', function() {
        const code = codeInput.value.trim();
        const language = document.getElementById('language').value;
        
        if (!code) {
            showError('Please provide your solution code');
            return;
        }
        
        submitSolution(code, language);
    });
}

async function testSolution(code, language) {
    const problemId = new URLSearchParams(window.location.search).get('id');
    
    try {
        showMessage('Testing your solution...', 'info');
        
        const response = await fetch('/api/practice/test-solution', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                problemId: problemId,
                code: code,
                language: language
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Test completed! Check the results below.', 'success');
            displayTestResults(result.data);
        } else {
            showError(result.error || 'Test failed');
        }
        
    } catch (error) {
        showError('Failed to test solution. Please try again.');
    }
}

async function submitSolution(code, language) {
    const problemId = new URLSearchParams(window.location.search).get('id');
    
    try {
        showMessage('Submitting your solution...', 'info');
        
        const response = await fetch('/api/practice/submit-solution', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                problemId: problemId,
                code: code,
                language: language
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showMessage('Solution submitted successfully!', 'success');
            // Optionally redirect to submissions page or show detailed results
        } else {
            showError(result.error || 'Submission failed');
        }
        
    } catch (error) {
        showError('Failed to submit solution. Please try again.');
    }
}

function displayTestResults(results) {
    // Create or get test results container
    let resultsContainer = document.getElementById('test-results-container');
    
    if (!resultsContainer) {
        resultsContainer = document.createElement('div');
        resultsContainer.id = 'test-results-container';
        resultsContainer.className = 'test-results-container';
        
        // Insert after submission section
        const submissionSection = document.querySelector('.submission-section');
        submissionSection.parentNode.insertBefore(resultsContainer, submissionSection.nextSibling);
    }
    
    const { status, message, testResults, executionTime, memoryUsed } = results;
    
    // Check if it's our special message about compilers not being implemented
    if (testResults && testResults.length > 0 && 
        testResults[0].actualOutput && testResults[0].actualOutput.includes("Test functionality not fully implemented yet")) {
        resultsContainer.innerHTML = `
            <div class="test-results-header warning">
                <div class="result-status">
                    <i class="fas fa-info-circle"></i>
                    <h3>Test Results</h3>
                    <span class="status-badge warning">Development Mode</span>
                </div>
                <p class="result-message">Running in simulation mode</p>
                <p>The compiler/interpreter for this language is currently in development mode.</p>
                <p>Try JavaScript or Python for best simulation experience.</p>
            </div>
        `;
        return;
    }
    
    // Create results header
    const headerClass = status === 'passed' ? 'success' : (status === 'no_tests' ? 'warning' : 'error');
    const headerIcon = status === 'passed' ? 'check-circle' : (status === 'no_tests' ? 'info-circle' : 'times-circle');
    
    let resultsHTML = `
        <div class="test-results-header ${headerClass}">
            <div class="result-status">
                <i class="fas fa-${headerIcon}"></i>
                <h3>Test Results</h3>
                <span class="status-badge ${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </div>
            <p class="result-message">${message}</p>
        </div>
    `;
    
    if (testResults && testResults.length > 0) {
        // Add execution stats
        resultsHTML += `
            <div class="execution-stats">
                <div class="stat">
                    <i class="fas fa-clock"></i>
                    <span>Execution Time: ${executionTime}ms</span>
                </div>
                <div class="stat">
                    <i class="fas fa-memory"></i>
                    <span>Memory Used: ${(memoryUsed / 1024).toFixed(2)}KB</span>
                </div>
            </div>
        `;
        
        // Add individual test case results
        resultsHTML += '<div class="test-cases-results">';
        
        testResults.forEach((testResult, index) => {
            const testStatus = testResult.status === 'passed' ? 'passed' : 'failed';
            const testIcon = testResult.status === 'passed' ? 'check' : 'times';
            
            resultsHTML += `
                <div class="test-case-result ${testStatus}">
                    <div class="test-case-header">
                        <span class="test-case-number">
                            <i class="fas fa-${testIcon}"></i>
                            Test Case ${index + 1}
                        </span>
                        <span class="test-case-status ${testStatus}">${testResult.status.toUpperCase()}</span>
                    </div>
                    
                    <div class="test-case-details">
                        <div class="test-input">
                            <strong>Input:</strong>
                            <pre><code>${escapeHtml(testResult.input)}</code></pre>
                        </div>
                        
                        <div class="test-output-comparison">
                            <div class="expected-output">
                                <strong>Expected Output:</strong>
                                <pre><code>${escapeHtml(testResult.expectedOutput)}</code></pre>
                            </div>
                            
                            <div class="actual-output">
                                <strong>Your Output:</strong>
                                <pre><code class="${testStatus}">${escapeHtml(testResult.actualOutput)}</code></pre>
                            </div>
                        </div>
                        
                        ${testResult.error ? `
                            <div class="test-error">
                                <strong>Error:</strong>
                                <pre><code class="error">${escapeHtml(testResult.error)}</code></pre>
                            </div>
                        ` : ''}
                        
                        <div class="test-case-stats">
                            <span><i class="fas fa-clock"></i> ${testResult.executionTime}ms</span>
                            <span><i class="fas fa-memory"></i> ${(testResult.memoryUsed / 1024).toFixed(2)}KB</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        resultsHTML += '</div>';
    }
    
    resultsContainer.innerHTML = resultsHTML;
    
    // Add click handlers for expandable test cases
    if (testResults && testResults.length > 0) {
        const testCaseHeaders = resultsContainer.querySelectorAll('.test-case-header');
        testCaseHeaders.forEach(header => {
            header.addEventListener('click', function() {
                const testCaseResult = this.parentElement;
                testCaseResult.classList.toggle('expanded');
            });
        });
    }
    
    // Scroll to results
    resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message-container');
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.innerHTML = `
        <i class="fas fa-${getIconForType(type)}"></i>
        <span>${message}</span>
        <button class="message-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    messageContainer.appendChild(messageElement);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageElement.parentElement) {
            messageElement.remove();
        }
    }, 5000);
}

function showError(message) {
    showMessage(message, 'error');
}

function getIconForType(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function populateFallbackContent(problemId) {
    // Set fallback content when API fails
    document.getElementById('problem-title').textContent = `Problem #${problemId}`;
    document.getElementById('problem-id').textContent = `Problem #${problemId}`;
    
    const difficultyElement = document.getElementById('problem-difficulty');
    difficultyElement.textContent = 'Unknown';
    difficultyElement.className = 'difficulty-tag medium';
    
    const descriptionElement = document.getElementById('problem-description');
    descriptionElement.innerHTML = `
        <div style="padding: 20px; background: var(--code-background); border-radius: 8px; border-left: 4px solid var(--error-color);">
            <h3 style="color: var(--error-color); margin-bottom: 15px;">
                <i class="fas fa-exclamation-triangle"></i> Problem Not Found
            </h3>
            <p>This problem could not be loaded. This might be because:</p>
            <ul>
                <li>The database is not connected</li>
                <li>No sample problems have been added to the database</li>
                <li>The problem ID does not exist</li>
            </ul>
            <p><strong>To fix this:</strong></p>
            <ol>
                <li>Make sure your MySQL database is running and connected</li>
                <li>Insert sample problems using the SQL queries provided</li>
                <li>Check the browser console for detailed error messages</li>
            </ol>
        </div>
    `;
    
    document.getElementById('input-format-content').textContent = 'Database connection required';
    document.getElementById('output-format-content').textContent = 'Database connection required';
    
    const examplesContainer = document.getElementById('examples-container');
    examplesContainer.innerHTML = '<p style="color: var(--text-secondary); font-style: italic;">Examples will be available once the database is connected and sample data is added.</p>';
    
    document.title = `Problem #${problemId} - BrainJam`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}