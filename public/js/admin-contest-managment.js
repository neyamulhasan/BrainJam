// Admin Contest Management JavaScript
document.addEventListener("DOMContentLoaded", function() {
    initializePage();
    loadContests();
});

let allContests = [];
let selectedContestId = null;

function initializePage() {
    console.log("Competition management page initialized");
    setupEventListeners();
    setupModal();
}

function setupEventListeners() {
    const createBtn = document.getElementById("createContestBtn");
    if (createBtn) {
        createBtn.addEventListener("click", function() {
            window.location.href = "admin-create-contest.html";
        });
    }
    
    const searchInput = document.getElementById("contestSearch");
    if (searchInput) {
        searchInput.addEventListener("input", filterContests);
    }
    
    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter) {
        statusFilter.addEventListener("change", filterContests);
    }
}

function setupModal() {
    const modal = document.getElementById("contestModal");
    if (!modal) return;
    
    const closeButtons = document.querySelectorAll(".close-btn, .close-modal");
    closeButtons.forEach(function(btn) {
        btn.addEventListener("click", function() {
            modal.classList.add("hidden");
        });
    });
    
    window.addEventListener("click", function(e) {
        if (e.target === modal) {
            modal.classList.add("hidden");
        }
    });
}

async function loadContests() {
    const tableBody = document.querySelector("#contestTableBody");
    if (!tableBody) return;
    
    try {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center"><i class="fas fa-spinner fa-spin"></i> Loading...</td></tr>';
        
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
        const response = await fetch("/api/contests/fetch-contests", {
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });
        
        const data = await response.json();
        console.log("✅ Contest data received:", data);
        allContests = data.contests || [];
        console.log("✅ Processed contests:", allContests);
        renderContests(allContests);
        
    } catch (error) {
        console.error("Error loading contests:", error);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading competitions</td></tr>';
    }
}

function renderContests(contests) {
    const tableBody = document.querySelector("#contestTableBody");
    if (!tableBody) return;
    
    if (contests.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center">No competitions found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = "";
    contests.forEach(function(contest) {
        const row = document.createElement("tr");
        row.className = "contest-row";
        row.innerHTML = buildContestRow(contest);
        tableBody.appendChild(row);
    });
}

function buildContestRow(contest) {
    const status = getContestStatus(contest);
    const duration = contest.duration || calculateDuration(contest.start_time, contest.end_time);
    const participantCount = contest.participant_count || 0;
    
    console.log("Building row for contest:", {
        id: contest.id,
        title: contest.title,
        duration: duration,
        participantCount: participantCount,
        rawDuration: contest.duration,
        rawParticipantCount: contest.participant_count
    });
    
    return `
        <td>
            <strong>${escapeHtml(contest.title)}</strong><br>
            <small>${escapeHtml(contest.description || "")}</small>
        </td>
        <td>${formatDate(contest.start_time)}</td>
        <td>${duration} hours</td>
        <td>${participantCount}</td>
        <td><span class="badge badge-${status.class}">${status.text}</span></td>
        <td>
            <button onclick="showContestDetails(${contest.id})" class="btn btn-sm btn-info">View</button>
            <button onclick="editContest(${contest.id})" class="btn btn-sm btn-primary">Edit</button>
            <button onclick="deleteContest(${contest.id})" class="btn btn-sm btn-danger">Delete</button>
        </td>
    `;
}

function getContestStatus(contest) {
    const now = new Date();
    const start = new Date(contest.start_time);
    const end = new Date(contest.end_time);
    
    if (now < start) return { text: "Upcoming", class: "warning" };
    if (now > end) return { text: "Ended", class: "secondary" };
    return { text: "Live", class: "success" };
}

function formatDate(dateString) {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
}

function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) return "N/A";
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    return diffHours;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

async function showContestDetails(contestId) {
    try {
        selectedContestId = contestId;
        
        const contest = allContests.find(function(c) { return c.id == contestId; });
        if (!contest) {
            alert('Contest not found');
            return;
        }

        // Populate modal with contest data
        const modal = document.getElementById("contestModal");
        const contestTitle = document.getElementById("contestTitle");
        const contestStart = document.getElementById("contestStart");
        const contestDuration = document.getElementById("contestDuration");
        const contestParticipants = document.getElementById("contestParticipants");
        const contestStatus = document.getElementById("contestStatus");
        const contestProblems = document.getElementById("contestProblems");

        if (contestTitle) contestTitle.textContent = contest.title;
        if (contestStart) contestStart.textContent = formatDate(contest.start_time);
        if (contestDuration) contestDuration.textContent = contest.duration + " hours";
        if (contestParticipants) contestParticipants.textContent = contest.participant_count || 0;
        
        const status = getContestStatus(contest);
        if (contestStatus) {
            contestStatus.innerHTML = '<span class="badge badge-' + status.class + '">' + status.text + '</span>';
        }

        // Load contest problems
        if (contestProblems) {
            try {
                const token = localStorage.getItem("token") || localStorage.getItem("authToken");
                const res = await fetch("/api/contests/" + contestId + "/problems", {
                    headers: {
                        Authorization: "Bearer " + token,
                    },
                });
                const data = await res.json();
                
                contestProblems.innerHTML = '';
                if (data.problems && data.problems.length > 0) {
                    data.problems.forEach(function(problem) {
                        const li = document.createElement('li');
                        li.innerHTML = '<strong>' + escapeHtml(problem.title) + '</strong> <span class="difficulty">' + problem.difficulty + '</span>';
                        contestProblems.appendChild(li);
                    });
                } else {
                    contestProblems.innerHTML = '<li>No problems assigned</li>';
                }
            } catch (error) {
                contestProblems.innerHTML = '<li>Failed to load problems</li>';
            }
        }

        // Setup modal buttons
        const editBtn = document.getElementById("editContestBtn");
        const deleteBtn = document.getElementById("deleteContestBtn");
        
        if (editBtn) {
            editBtn.onclick = function() { editContest(contestId); };
        }
        
        if (deleteBtn) {
            deleteBtn.onclick = function() { deleteContest(contestId); };
        }

        // Show modal
        if (modal) {
            modal.classList.remove('hidden');
        }

    } catch (error) {
        console.error('Error showing contest details:', error);
        alert('Failed to load contest details');
    }
}

function editContest(contestId) {
    window.location.href = "admin-edit-contest.html?id=" + contestId;
}

async function deleteContest(contestId) {
    if (!confirm("Are you sure you want to delete this competition? This action cannot be undone.")) {
        return;
    }

    try {
        const token = localStorage.getItem("token") || localStorage.getItem("authToken");
        
        const response = await fetch("/api/contests/" + contestId, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token,
            }
        });

        if (response.ok) {
            alert('Competition deleted successfully');
            const modal = document.getElementById("contestModal");
            if (modal) modal.classList.add('hidden');
            loadContests(); // Reload the table
        } else {
            throw new Error('Failed to delete contest');
        }
    } catch (error) {
        console.error('Error deleting contest:', error);
        alert('Failed to delete competition');
    }
}

function filterContests() {
    const searchInput = document.getElementById("contestSearch");
    const statusFilter = document.getElementById("statusFilter");
    
    if (!searchInput || !statusFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;
    
    const filtered = allContests.filter(function(contest) {
        const matchesSearch = contest.title.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusValue || getContestStatus(contest).text.toLowerCase() === statusValue;
        return matchesSearch && matchesStatus;
    });
    
    renderContests(filtered);
}
