// Learn Page JavaScript

let currentPage = 1;
let currentLimit = 12;
let currentCategory = '';
let currentSort = 'newest';
let currentTab = 'all';
let searchTimeout;

// State management
let state = {
    resources: [],
    categories: [],
    currentUser: null,
    loading: false,
    pagination: {
        page: 1,
        totalPages: 1,
        total: 0
    }
};

// DOM Elements
const resourcesGrid = document.getElementById('resources-grid');
const popularResourcesGrid = document.getElementById('popular-resources-grid');
const recentResourcesGrid = document.getElementById('recent-resources-grid');
const categoryList = document.getElementById('category-list');
const categoryFilter = document.getElementById('category-filter');
const sortFilter = document.getElementById('sort-filter');
const resourceSearch = document.getElementById('resource-search');
const refreshBtn = document.getElementById('refresh-btn');
const pagination = document.getElementById('pagination');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const currentPageSpan = document.getElementById('current-page');
const totalPagesSpan = document.getElementById('total-pages');

// Stats elements
const totalResourcesSpan = document.getElementById('total-resources');
const totalCategoriesSpan = document.getElementById('total-categories');
const totalReadTimeSpan = document.getElementById('total-read-time');

// Modal elements
const resourceModal = document.getElementById('resource-modal');
const resourceDetail = document.getElementById('resource-detail');
const closeResourceModal = document.getElementById('close-resource-modal');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
});

function initializePage() {
    loadCategories();
    loadResources();
    checkAuthStatus();
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.control-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabType = this.dataset.tab;
            switchTab(tabType);
        });
    });

    // Filter changes
    categoryFilter.addEventListener('change', function() {
        currentCategory = this.value;
        currentPage = 1;
        loadResources();
    });

    sortFilter.addEventListener('change', function() {
        currentSort = this.value;
        currentPage = 1;
        loadResources();
    });

    // Search
    resourceSearch.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentPage = 1;
            loadResources();
        }, 500);
    });

    // Refresh button
    refreshBtn.addEventListener('click', function() {
        refreshData();
    });

    // Pagination
    prevBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            loadResources();
        }
    });

    nextBtn.addEventListener('click', function() {
        if (currentPage < state.pagination.totalPages) {
            currentPage++;
            loadResources();
        }
    });

    // Modal
    closeResourceModal.addEventListener('click', function() {
        resourceModal.style.display = 'none';
    });

    window.addEventListener('click', function(event) {
        if (event.target === resourceModal) {
            resourceModal.style.display = 'none';
        }
    });
}

function switchTab(tabType) {
    // Update active tab
    document.querySelectorAll('.control-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabType}"]`).classList.add('active');

    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabType}-content`).classList.add('active');

    currentTab = tabType;
    currentPage = 1;
    loadResources();
}

async function checkAuthStatus() {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            const response = await fetch('/api/dashboard/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                state.currentUser = data.user;
            }
        }
    } catch (error) {
    }
}

async function loadCategories() {
    try {
        const response = await fetch('/api/learn/categories');
        const data = await response.json();
        
        if (data.success) {
            state.categories = data.categories;
            renderCategories();
            populateCategoryFilter();
            updateStats();
        }
    } catch (error) {
        showError('Failed to load categories');
    }
}

function renderCategories() {
    if (state.categories.length === 0) {
        categoryList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <h3>No Categories Found</h3>
                <p>Categories will appear here when they are added.</p>
            </div>
        `;
        return;
    }

    categoryList.innerHTML = state.categories.map(category => `
        <div class="category-card" data-category="${category.slug}" onclick="filterByCategory('${category.slug}')">
            <div class="category-name">${escapeHtml(category.name)}</div>
            <div class="category-count">${category.resource_count} resources</div>
        </div>
    `).join('');
}

function populateCategoryFilter() {
    const options = state.categories.map(category => 
        `<option value="${category.slug}">${escapeHtml(category.name)}</option>`
    ).join('');
    
    categoryFilter.innerHTML = `
        <option value="">All Categories</option>
        ${options}
    `;
}

function filterByCategory(categorySlug) {
    currentCategory = categorySlug;
    categoryFilter.value = categorySlug;
    currentPage = 1;
    
    // Update active category card
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelector(`[data-category="${categorySlug}"]`)?.classList.add('active');
    
    loadResources();
}

async function loadResources() {
    const targetGrid = getTargetGrid();
    showLoadingState(targetGrid);
    
    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: currentLimit
        });
        
        if (currentCategory) {
            params.append('category', currentCategory);
        }
        
        const searchQuery = resourceSearch.value.trim();
        if (searchQuery) {
            params.append('search', searchQuery);
        }
        
        // Apply sorting based on current tab and sort filter
        if (currentTab === 'popular') {
            params.append('sort', 'popular');
        } else if (currentTab === 'recent') {
            params.append('sort', 'newest');
        } else {
            params.append('sort', currentSort);
        }
        
        const response = await fetch(`/api/learn/resources?${params}`);
        const data = await response.json();
        
        if (data.success) {
            state.resources = data.resources;
            state.pagination = data.pagination;
            renderResources(targetGrid);
            updatePagination();
            updateStats();
        } else {
            showError(data.error);
        }
    } catch (error) {
        showError('Failed to load resources');
        showEmptyState(targetGrid, 'Failed to load resources');
    }
}

function getTargetGrid() {
    switch (currentTab) {
        case 'popular':
            return popularResourcesGrid;
        case 'recent':
            return recentResourcesGrid;
        default:
            return resourcesGrid;
    }
}

function showLoadingState(grid) {
    grid.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading resources...</span>
        </div>
    `;
}

function renderResources(grid) {
    if (state.resources.length === 0) {
        showEmptyState(grid, 'No resources found');
        return;
    }
    
    grid.innerHTML = state.resources.map(resource => `
        <div class="resource-card" onclick="openResourceModal('${resource.slug}')">
            <div class="resource-image">
                ${resource.featured_image ? 
                    `<img src="${resource.featured_image}" alt="${escapeHtml(resource.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                     <div class="default-icon" style="display:none;"><i class="fas fa-book"></i></div>` :
                    `<div class="default-icon"><i class="fas fa-book"></i></div>`
                }
            </div>
            <div class="resource-content">
                <div class="resource-meta">
                    <span class="resource-category">${escapeHtml(resource.category_name)}</span>
                    <span><i class="fas fa-user"></i> ${escapeHtml(resource.author_name)}</span>
                    <span><i class="fas fa-clock"></i> ${resource.estimated_read_time} min read</span>
                </div>
                <h3 class="resource-title">${escapeHtml(resource.title)}</h3>
                <p class="resource-description">${escapeHtml(resource.meta_description || 'No description available')}</p>
                <div class="resource-footer">
                    <div class="resource-stats">
                        <div class="resource-stat">
                            <i class="fas fa-eye"></i>
                            <span>${resource.view_count}</span>
                        </div>
                        <div class="resource-stat">
                            <i class="fas fa-calendar"></i>
                            <span>${formatDate(resource.published_at)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function showEmptyState(grid, message) {
    grid.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-search"></i>
            <h3>No Resources Found</h3>
            <p>${message}</p>
        </div>
    `;
}

async function openResourceModal(slug) {
    resourceModal.style.display = 'block';
    resourceDetail.innerHTML = `
        <div class="loading-state">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Loading resource...</span>
        </div>
    `;
    
    try {
        const response = await fetch(`/api/learn/resources/${slug}`);
        const data = await response.json();
        
        if (data.success) {
            renderResourceDetail(data.resource);
        } else {
            resourceDetail.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Resource Not Found</h3>
                    <p>${data.error}</p>
                </div>
            `;
        }
    } catch (error) {
        resourceDetail.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Resource</h3>
                <p>Failed to load resource details</p>
            </div>
        `;
    }
}

function renderResourceDetail(resource) {
    resourceDetail.innerHTML = `
        <div class="resource-detail-header">
            <h2 class="resource-detail-title">${escapeHtml(resource.title)}</h2>
            <div class="resource-detail-meta">
                <span class="resource-detail-category">${escapeHtml(resource.category_name)}</span>
                <span class="resource-detail-info">
                    <i class="fas fa-user"></i> ${escapeHtml(resource.author_name)}
                </span>
                <span class="resource-detail-info">
                    <i class="fas fa-clock"></i> ${resource.estimated_read_time} min read
                </span>
                <span class="resource-detail-info">
                    <i class="fas fa-eye"></i> ${resource.view_count} views
                </span>
                <span class="resource-detail-info">
                    <i class="fas fa-calendar"></i> ${formatDate(resource.published_at)}
                </span>
            </div>
        </div>
        <div class="resource-detail-content">
            ${markdownToHtml(resource.content)}
        </div>
        ${resource.tags && resource.tags.length > 0 ? `
            <div class="resource-detail-tags">
                <h4><i class="fas fa-tags"></i> Tags</h4>
                <div class="resource-tags">
                    ${resource.tags.map(tag => `<span class="resource-tag">${escapeHtml(tag)}</span>`).join('')}
                </div>
            </div>
        ` : ''}
        <div class="resource-detail-footer">
            <div class="resource-stats">
                <div class="resource-stat">
                    <i class="fas fa-eye"></i>
                    <span>${resource.views || 0} views</span>
                </div>
                <div class="resource-stat">
                    <i class="fas fa-clock"></i>
                    <span>${resource.estimated_read_time || 0} min read</span>
                </div>
                <div class="resource-stat">
                    <i class="fas fa-calendar"></i>
                    <span>${formatDate(resource.published_at)}</span>
                </div>
            </div>
        </div>
    `;
}

function updatePagination() {
    currentPageSpan.textContent = state.pagination.page;
    totalPagesSpan.textContent = state.pagination.totalPages;
    
    prevBtn.disabled = state.pagination.page <= 1;
    nextBtn.disabled = state.pagination.page >= state.pagination.totalPages;
    
    pagination.style.display = state.pagination.totalPages > 1 ? 'flex' : 'none';
}

function updateStats() {
    totalResourcesSpan.textContent = state.pagination.total || 0;
    totalCategoriesSpan.textContent = state.categories.length;
    
    // Calculate total read time
    const totalReadTime = state.resources.reduce((total, resource) => {
        return total + (resource.estimated_read_time || 0);
    }, 0);
    totalReadTimeSpan.textContent = totalReadTime;
}

function refreshData() {
    loadCategories();
    loadResources();
    showSuccess('Data refreshed successfully!');
}

// Utility functions
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    
    return text ? text.replace(/[&<>"']/g, function(m) { return map[m]; }) : '';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function markdownToHtml(markdown) {
    // Enhanced markdown to HTML conversion
    if (!markdown) return '';
    
    let html = markdown
        // Handle code blocks first (before line breaks)
        .replace(/```(\w+)?\s*\n([\s\S]*?)\n```/g, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        
        // Headers
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        
        // Lists
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        
        // Bold and italic
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        
        // Inline code
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        
        // Line breaks and paragraphs
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        
        // Links (basic support)
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        
        // Wrap in paragraphs if needed
        .replace(/^(?!<[hlu]|<pre|<div)(.+)/gm, '<p>$1</p>');
    
    // Clean up lists
    html = html.replace(/(<li>.*<\/li>)/gs, function(match) {
        return '<ul>' + match + '</ul>';
    });
    
    // Clean up empty paragraphs and fix formatting
    html = html
        .replace(/<p><\/p>/g, '')
        .replace(/<p>(<h[1-6]>)/g, '$1')
        .replace(/(<\/h[1-6]>)<\/p>/g, '$1')
        .replace(/<p>(<pre>)/g, '$1')
        .replace(/(<\/pre>)<\/p>/g, '$1')
        .replace(/<p>(<ul>)/g, '$1')
        .replace(/(<\/ul>)<\/p>/g, '$1')
        .replace(/<br><\/p>/g, '</p>')
        .replace(/<p><br>/g, '<p>');
    
    return html;
}

function showError(message) {
    showMessage(message, 'error');
}

function showSuccess(message) {
    showMessage(message, 'success');
}

function showMessage(message, type) {
    const messageContainer = document.getElementById('message-container');
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}`;
    messageElement.innerHTML = `
        <span>${escapeHtml(message)}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;
    
    messageContainer.appendChild(messageElement);
    
    setTimeout(() => {
        if (messageElement.parentElement) {
            messageElement.remove();
        }
    }, 5000);
}