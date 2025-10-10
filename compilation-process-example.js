// Example: Complete C++ Compilation Process in BrainJam

/*
STEP-BY-STEP COMPILATION EXAMPLE
================================

Let's say a student submits this C++ code for the "Sum It Up" problem:
*/

// Student's submitted code:
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}

/*
HERE'S EXACTLY WHAT HAPPENS IN THE BACKEND:
===========================================

1. CODE RECEPTION
   - Frontend sends: { problemId: 1, code: "...", language: "cpp" }
   - Backend receives the submission

2. UNIQUE FILE GENERATION
   - Generate unique ID: "a1b2c3d4e5f6..."
   - Create temp directory: /home/linux/SE project/BrainJam/temp/
   - Filename: solution_a1b2c3d4e5f6.cpp

3. FILE WRITING
   - Write student's code to: temp/solution_a1b2c3d4e5f6.cpp
   - Ensure file permissions and encoding

4. COMPILATION PHASE
   - Command: g++ -o temp/solution_a1b2c3d4e5f6 temp/solution_a1b2c3d4e5f6.cpp
   - This creates executable: temp/solution_a1b2c3d4e5f6
   - If compilation fails → return compilation error to student

5. TEST CASE EXECUTION
   - Get test case: input="2 3", expected="5"
   - Execute: echo "2 3" | temp/solution_a1b2c3d4e5f6
   - Capture output: "5"
   - Compare: actual="5" vs expected="5" → PASS ✅

6. CLEANUP
   - Delete: temp/solution_a1b2c3d4e5f6.cpp
   - Delete: temp/solution_a1b2c3d4e5f6
   - Return results to student

ACTUAL SHELL COMMANDS EXECUTED:
===============================
*/

// 1. Create temporary file
// echo '#include <iostream>...' > temp/solution_a1b2c3d4e5f6.cpp

// 2. Compile the code
// g++ -o temp/solution_a1b2c3d4e5f6 temp/solution_a1b2c3d4e5f6.cpp

// 3. Run with test input
// echo "2 3" | temp/solution_a1b2c3d4e5f6

// 4. Capture output and compare
// Expected: "5", Actual: "5" → TEST PASSED

/*
ERROR HANDLING:
===============

If compilation fails:
- stderr: "error: 'cinn' was not declared in this scope"
- Status: "Compilation Error"
- Student sees: Detailed compilation error message

If runtime error occurs:
- stderr: "Segmentation fault"
- Status: "Runtime Error"  
- Student sees: Runtime error details

If timeout occurs:
- Process killed after 5 seconds
- Status: "Time Limit Exceeded"
- Student sees: "Your code took too long to execute"

SECURITY MEASURES:
==================
*/

// 1. Each submission gets unique filename (prevents conflicts)
// 2. Files executed in isolated temp directory
// 3. Automatic cleanup prevents disk space issues
// 4. Timeout prevents infinite loops
// 5. Limited memory and CPU usage

/*
SUPPORTED COMPILATION FLAGS:
============================

C++: g++ -o executable source.cpp
- Standard: C++17
- Optimization: None (for debugging)
- Warnings: Default

Java: javac ClassName.java
- Version: Java 11+
- Classpath: Current directory
- Encoding: UTF-8

Python: python3 script.py
- Version: Python 3.8+
- No compilation needed
- Direct interpretation

JavaScript: node script.js
- Version: Node.js 16+
- No compilation needed
- Direct execution

REAL EXAMPLE OUTPUT:
===================
*/

console.log(`
Student Submission:
Problem ID: 1
Language: cpp
Code: #include<iostream>...

Compilation Process:
✅ File created: temp/solution_a1b2c3d4e5f6.cpp
✅ Compilation: g++ -o temp/solution_a1b2c3d4e5f6 temp/solution_a1b2c3d4e5f6.cpp
✅ Executable created: temp/solution_a1b2c3d4e5f6

Test Execution:
✅ Test Case 1: echo "2 3" | temp/solution_a1b2c3d4e5f6
   Expected: "5"
   Actual: "5"
   Status: PASSED ✅

✅ Test Case 2: echo "100 250" | temp/solution_a1b2c3d4e5f6
   Expected: "350"
   Actual: "350"
   Status: PASSED ✅

✅ Test Case 3: echo "-7 4" | temp/solution_a1b2c3d4e5f6
   Expected: "-3"
   Actual: "-3"
   Status: PASSED ✅

Final Result:
Status: ACCEPTED
Score: 100%
Tests Passed: 3/3
Execution Time: 12ms
Memory Used: 1024KB
`);