/**
 * Scottship Solutions Ticketing Portal - API Client
 * Handles all API communications
 */

const API_BASE_URL = '/api';

const api = {
    /**
     * Make an authenticated API request
     */
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const session = this.getSession();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (session?.token) {
            headers['Authorization'] = `Bearer ${session.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (response.status === 401) {
                // Session expired, clear and redirect
                this.clearSession();
                // Redirect based on current page
                const isTeamPage = window.location.pathname.includes('/team/');
                window.location.href = isTeamPage ? '/team/login.html' : '/customer/login.html';
                return { success: false, message: 'Session expired' };
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    /**
     * Get current session from localStorage
     */
    getSession() {
        const customerSession = localStorage.getItem('customerSession');
        const teamSession = localStorage.getItem('teamSession');

        if (customerSession) {
            return JSON.parse(customerSession);
        }
        if (teamSession) {
            return JSON.parse(teamSession);
        }
        return null;
    },

    /**
     * Clear session
     */
    clearSession() {
        localStorage.removeItem('customerSession');
        localStorage.removeItem('teamSession');
    },

    /**
     * Login
     */
    async login(userType, email, password) {
        return this.request(`/auth/${userType}/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    },

    /**
     * Logout
     */
    async logout() {
        const result = await this.request('/auth/logout', {
            method: 'POST',
        });
        this.clearSession();
        return result;
    },

    /**
     * Request password reset
     */
    async requestPasswordReset(email, userType) {
        return this.request('/auth/password-reset', {
            method: 'POST',
            body: JSON.stringify({ email, userType }),
        });
    },

    /**
     * Reset password with token
     */
    async resetPassword(token, newPassword) {
        return this.request('/auth/password-reset/confirm', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword }),
        });
    },

    // ==================== Tickets ====================

    /**
     * Get all tickets (for customer: their tickets, for team: all tickets)
     */
    async getTickets(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/tickets?${params}`);
    },

    /**
     * Get single ticket
     */
    async getTicket(ticketId) {
        return this.request(`/tickets/${ticketId}`);
    },

    /**
     * Create new ticket
     */
    async createTicket(ticketData) {
        return this.request('/tickets', {
            method: 'POST',
            body: JSON.stringify(ticketData),
        });
    },

    /**
     * Update ticket
     */
    async updateTicket(ticketId, updates) {
        return this.request(`/tickets/${ticketId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },

    /**
     * Add reply to ticket
     */
    async addReply(ticketId, content, isInternal = false) {
        return this.request(`/tickets/${ticketId}/replies`, {
            method: 'POST',
            body: JSON.stringify({ content, isInternal }),
        });
    },

    /**
     * Get ticket replies
     */
    async getReplies(ticketId) {
        return this.request(`/tickets/${ticketId}/replies`);
    },

    // ==================== Customers (Team Only) ====================

    /**
     * Get all customers
     */
    async getCustomers(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/customers?${params}`);
    },

    /**
     * Get single customer
     */
    async getCustomer(customerId) {
        return this.request(`/customers/${customerId}`);
    },

    /**
     * Create customer
     */
    async createCustomer(customerData) {
        return this.request('/customers', {
            method: 'POST',
            body: JSON.stringify(customerData),
        });
    },

    /**
     * Update customer
     */
    async updateCustomer(customerId, updates) {
        return this.request(`/customers/${customerId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },

    /**
     * Update own profile (customer self-service)
     */
    async updateMyProfile(updates) {
        return this.request('/customers/me', {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },

    /**
     * Change own password (customer self-service)
     */
    async changeMyPassword(currentPassword, newPassword) {
        return this.request('/customers/me/password', {
            method: 'PUT',
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword,
            }),
        });
    },

    // ==================== Users (Admin Only) ====================

    /**
     * Get all team users
     */
    async getUsers() {
        return this.request('/users');
    },

    /**
     * Create team user
     */
    async createUser(userData) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    /**
     * Update team user
     */
    async updateUser(userId, updates) {
        return this.request(`/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },

    // ==================== Stats ====================

    /**
     * Get dashboard stats
     */
    async getStats() {
        return this.request('/stats');
    },

    /**
     * Get reports data
     */
    async getReports(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/reports?${params}`);
    },

    // ==================== Categories ====================

    /**
     * Get ticket categories
     */
    async getCategories() {
        return this.request('/categories');
    },

    // ==================== Companies ====================

    /**
     * Get all companies
     */
    async getCompanies() {
        return this.request('/companies');
    },

    /**
     * Get single company
     */
    async getCompany(companyId) {
        return this.request(`/companies/${companyId}`);
    },

    /**
     * Create company
     */
    async createCompany(companyData) {
        return this.request('/companies', {
            method: 'POST',
            body: JSON.stringify(companyData),
        });
    },

    /**
     * Update company
     */
    async updateCompany(companyId, updates) {
        return this.request(`/companies/${companyId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },

    // ==================== Knowledge Base ====================

    /**
     * Get KB categories
     */
    async getKBCategories() {
        return this.request('/kb-categories');
    },

    /**
     * Create KB category
     */
    async createKBCategory(categoryData) {
        return this.request('/kb-categories', {
            method: 'POST',
            body: JSON.stringify(categoryData),
        });
    },

    /**
     * Update KB category
     */
    async updateKBCategory(categoryId, updates) {
        return this.request(`/kb-categories/${categoryId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },

    /**
     * Get KB tags
     */
    async getKBTags() {
        return this.request('/kb-tags');
    },

    /**
     * Create KB tag
     */
    async createKBTag(tagData) {
        return this.request('/kb-tags', {
            method: 'POST',
            body: JSON.stringify(tagData),
        });
    },

    /**
     * Update KB tag
     */
    async updateKBTag(tagId, updates) {
        return this.request(`/kb-tags/${tagId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },

    /**
     * Delete KB tag
     */
    async deleteKBTag(tagId) {
        return this.request(`/kb-tags/${tagId}`, {
            method: 'DELETE',
        });
    },

    /**
     * Get knowledge base articles
     */
    async getKnowledgeBase() {
        return this.request('/knowledge-base');
    },

    /**
     * Get single KB article
     */
    async getKBArticle(articleId) {
        return this.request(`/knowledge-base/${articleId}`);
    },

    /**
     * Create KB article
     */
    async createKBArticle(articleData) {
        return this.request('/knowledge-base', {
            method: 'POST',
            body: JSON.stringify(articleData),
        });
    },

    /**
     * Update KB article
     */
    async updateKBArticle(articleId, updates) {
        return this.request(`/knowledge-base/${articleId}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    },

    /**
     * Delete KB article
     */
    async deleteKBArticle(articleId) {
        return this.request(`/knowledge-base/${articleId}`, {
            method: 'DELETE',
        });
    },
};

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(dateString);
}

function getInitials(name) {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function getStatusLabel(status) {
    const labels = {
        'open': 'Open',
        'in_progress': 'In Progress',
        'waiting_on_customer': 'Waiting on Customer',
        'resolved': 'Resolved',
        'closed': 'Closed',
    };
    return labels[status] || status;
}

function getStatusClass(status) {
    const classes = {
        'open': 'badge-open',
        'in_progress': 'badge-in-progress',
        'waiting_on_customer': 'badge-waiting',
        'resolved': 'badge-resolved',
        'closed': 'badge-closed',
    };
    return classes[status] || '';
}

function getPriorityLabel(priority) {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
}

// Check authentication on page load
function requireAuth(userType) {
    const session = api.getSession();
    const storageKey = userType === 'customer' ? 'customerSession' : 'teamSession';
    const storedSession = localStorage.getItem(storageKey);

    if (!storedSession) {
        window.location.href = userType === 'customer' ? '/customer/login.html' : '/team/login.html';
        return null;
    }

    return JSON.parse(storedSession);
}
