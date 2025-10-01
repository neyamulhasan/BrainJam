document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.querySelector('.challenge-table tbody');
    const searchInput = document.getElementById('search-bar');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');

    let selectedDifficulty = '';

    // Fetch all problems
    async function fetchProblems() {
        try {
            const res = await fetch('/api/practice/problems');
            const data = await res.json();
            if (data.success) {
                console.log('Fetched problems:', data.data);
                console.log('Sample problem structure:', data.data[0]);
                return data.data;
            }
            console.error('Failed to fetch problems:', data.error);
            return [];
        } catch (err) {
            console.error('Error fetching problems:', err);
            return [];
        }
    }

    // Map difficulty to CSS class
    function getDifficultyClass(diff) {
        switch (diff.toLowerCase()) {
            case 'easy': return 'difficulty-beginner';
            case 'medium': return 'difficulty-intermediate';
            case 'hard': return 'difficulty-advanced';
            default: return '';
        }
    }

    // Filter problems by search & difficulty
    function filterProblems(problems, query, difficulty) {
        return problems.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(query.toLowerCase());
            const matchesDifficulty = difficulty ? p.difficulty === difficulty : true;
            return matchesSearch && matchesDifficulty;
        });
    }

    // Render table and attach click event for navigation
    async function renderTable(problems) {
        console.log('Rendering table with problems:', problems);
        tableBody.innerHTML = '';

        problems.forEach(problem => {
            console.log('Processing problem:', problem);
            console.log('Problem topics:', problem.topics);
            console.log('Problem difficulty:', problem.difficulty);
            
            const row = document.createElement('tr');
            row.classList.add('challenge-row');
            
            // Format topics as badges
            const topics = problem.topics ? problem.topics.split(', ').map(topic => 
                `<span class="topic-badge">${topic}</span>`
            ).join('') : '<span class="no-topics">No topics</span>';
            
            console.log('Formatted topics:', topics);
            
            row.innerHTML = `
                <td style="font-weight: 600; color: var(--primary-color);">#${problem.id}</td>
                <td>${problem.title}</td>
                <td class="topics-cell">${topics}</td>
                <td class="${getDifficultyClass(problem.difficulty)}">${problem.difficulty}</td>
            `;

            // Navigate to problem detail page on click
            row.addEventListener('click', () => {
                window.location.href = `problem-detail.html?id=${problem.id}`;
            });

            // Add hover effect
            row.style.cursor = 'pointer';
            row.addEventListener('mouseenter', () => {
                row.style.backgroundColor = 'rgba(0, 212, 255, 0.08)';
            });
            row.addEventListener('mouseleave', () => {
                row.style.backgroundColor = '';
            });

            tableBody.appendChild(row);
        });
    }

    // Initial fetch and render
    let problemsData = await fetchProblems();
    renderTable(problemsData);

    // Search filter
    searchInput.addEventListener('input', () => {
        const filtered = filterProblems(problemsData, searchInput.value, selectedDifficulty);
        renderTable(filtered);
    });

    // Difficulty filter
    difficultyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            difficultyButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            selectedDifficulty = btn.getAttribute('data-difficulty');
            if (selectedDifficulty.toLowerCase() === 'beginner') selectedDifficulty = 'Easy';
            if (selectedDifficulty.toLowerCase() === 'intermediate') selectedDifficulty = 'Medium';
            if (selectedDifficulty.toLowerCase() === 'advanced') selectedDifficulty = 'Hard';

            const filtered = filterProblems(problemsData, searchInput.value, selectedDifficulty);
            renderTable(filtered);
        });
    });
});
