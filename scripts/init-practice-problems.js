const db = require('../config/database');

const sampleProblems = [
    {
        slug: 'two-sum',
        title: 'Two Sum',
        body_md: `# Two Sum

Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

## Example 1:
\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
\`\`\`

## Example 2:
\`\`\`
Input: nums = [3,2,4], target = 6
Output: [1,2]
\`\`\``,
        input_format: 'First line contains n (array size) and target\nSecond line contains n space-separated integers',
        output_format: 'Two space-separated integers representing the indices',
        difficulty: 'Easy',
        is_public: 1
    },
    {
        slug: 'reverse-linked-list',
        title: 'Reverse Linked List',
        body_md: `# Reverse Linked List

Given the head of a singly linked list, reverse the list, and return the reversed list.

## Example 1:
\`\`\`
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]
\`\`\`

## Example 2:
\`\`\`
Input: head = [1,2]
Output: [2,1]
\`\`\``,
        input_format: 'First line contains n (number of nodes)\nSecond line contains n space-separated integers',
        output_format: 'Space-separated integers representing the reversed list',
        difficulty: 'Medium',
        is_public: 1
    },
    {
        slug: 'merge-k-sorted-lists',
        title: 'Merge k Sorted Lists',
        body_md: `# Merge k Sorted Lists

You are given an array of k linked-lists lists, each linked-list is sorted in ascending order.

Merge all the linked-lists into one sorted linked-list and return it.

## Example 1:
\`\`\`
Input: lists = [[1,4,5],[1,3,4],[2,6]]
Output: [1,1,2,3,4,4,5,6]
\`\`\``,
        input_format: 'First line contains k (number of lists)\nNext k lines contain sorted integers for each list',
        output_format: 'Space-separated integers representing the merged sorted list',
        difficulty: 'Hard',
        is_public: 1
    }
];

async function initProblems() {
    try {
        for (const problem of sampleProblems) {
            await db.execute(
                `INSERT INTO problems (slug, title, body_md, input_format, output_format, difficulty, is_public) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    problem.slug,
                    problem.title,
                    problem.body_md,
                    problem.input_format,
                    problem.output_format,
                    problem.difficulty,
                    problem.is_public
                ]
            );
        }
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

initProblems();