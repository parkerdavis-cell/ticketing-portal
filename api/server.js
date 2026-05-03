/**
 * Scottship Solutions Ticketing Portal - API Server
 * Uses JSON file storage for simplicity (can upgrade to PostgreSQL for production)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Production security and performance middleware
if (isProduction) {
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    }));
    app.use(compression());
    app.set('trust proxy', 1);
}

// Database file path
const DB_PATH = path.join(__dirname, '..', 'database', 'data.json');

// Initialize database
function initDB() {
    if (!fs.existsSync(path.dirname(DB_PATH))) {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    }

    if (!fs.existsSync(DB_PATH)) {
        const initialData = {
            companies: [
                {
                    id: 1,
                    name: 'Acme Corporation',
                    industry: 'Manufacturing',
                    address: '123 Main St, Springfield, IL',
                    phone: '(555) 123-4567',
                    notes: 'Long-term client since 2020',
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Tech Startup Inc',
                    industry: 'Technology',
                    address: '456 Innovation Way, Austin, TX',
                    phone: '(555) 987-6543',
                    notes: 'Fast-growing startup, needs quick response times',
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    name: 'Big Enterprise LLC',
                    industry: 'Finance',
                    address: '789 Corporate Blvd, New York, NY',
                    phone: '(555) 456-7890',
                    notes: 'Enterprise client with SLA requirements',
                    is_active: true,
                    created_at: new Date().toISOString()
                }
            ],
            customers: [
                {
                    id: 1,
                    company_id: 1,
                    name: 'John Smith',
                    email: 'demo@customer.com',
                    password_hash: bcrypt.hashSync('password123', 10),
                    phone: '(555) 123-4567',
                    role: 'IT Manager',
                    is_primary: true,
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    company_id: 1,
                    name: 'Jane Doe',
                    email: 'jane@acme.com',
                    password_hash: bcrypt.hashSync('password123', 10),
                    phone: '(555) 123-4568',
                    role: 'Developer',
                    is_primary: false,
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    company_id: 2,
                    name: 'Sarah Johnson',
                    email: 'sarah@techstartup.io',
                    password_hash: bcrypt.hashSync('password123', 10),
                    phone: '(555) 987-6543',
                    role: 'CTO',
                    is_primary: true,
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 4,
                    company_id: 3,
                    name: 'Michael Brown',
                    email: 'mbrown@bigenterprise.com',
                    password_hash: bcrypt.hashSync('password123', 10),
                    phone: '(555) 456-7890',
                    role: 'System Administrator',
                    is_primary: true,
                    is_active: true,
                    created_at: new Date().toISOString()
                }
            ],
            users: [
                {
                    id: 1,
                    name: 'Admin User',
                    email: 'admin@scottship.com',
                    password_hash: bcrypt.hashSync('admin123', 10),
                    role: 'admin',
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 2,
                    name: 'Sarah Tech',
                    email: 'sarah@scottship.com',
                    password_hash: bcrypt.hashSync('tech123', 10),
                    role: 'technician',
                    is_active: true,
                    created_at: new Date().toISOString()
                },
                {
                    id: 3,
                    name: 'Mike Support',
                    email: 'mike@scottship.com',
                    password_hash: bcrypt.hashSync('tech123', 10),
                    role: 'technician',
                    is_active: true,
                    created_at: new Date().toISOString()
                }
            ],
            categories: [
                { id: 1, name: 'Network', description: 'Network connectivity and infrastructure', is_active: true },
                { id: 2, name: 'Hardware', description: 'Physical equipment and devices', is_active: true },
                { id: 3, name: 'Software', description: 'Applications and software issues', is_active: true },
                { id: 4, name: 'Security', description: 'Security concerns and access', is_active: true },
                { id: 5, name: 'Email', description: 'Email and communication', is_active: true },
                { id: 6, name: 'Other', description: 'General inquiries', is_active: true }
            ],
            kb_categories: [
                { id: 1, name: 'Getting Started', description: 'Basic setup and onboarding guides', parent_id: null, is_active: true },
                { id: 2, name: 'Account & Billing', description: 'Account management and billing help', parent_id: null, is_active: true },
                { id: 3, name: 'Troubleshooting', description: 'Common issues and solutions', parent_id: null, is_active: true },
                { id: 4, name: 'Network Issues', description: 'Network connectivity problems', parent_id: 3, is_active: true },
                { id: 5, name: 'Software Issues', description: 'Application and software problems', parent_id: 3, is_active: true },
                { id: 6, name: 'How-To Guides', description: 'Step-by-step instructions', parent_id: null, is_active: true },
                { id: 7, name: 'FAQs', description: 'Frequently asked questions', parent_id: null, is_active: true }
            ],
            kb_tags: [
                { id: 1, name: 'vpn', color: '#3b82f6' },
                { id: 2, name: 'password', color: '#10b981' },
                { id: 3, name: 'email', color: '#f59e0b' },
                { id: 4, name: 'network', color: '#6366f1' },
                { id: 5, name: 'security', color: '#ef4444' },
                { id: 6, name: 'setup', color: '#8b5cf6' }
            ],
            knowledge_base: [
                {
                    id: 1,
                    title: 'How to Reset Your Password',
                    content: '## Resetting Your Password\n\nIf you\'ve forgotten your password, follow these steps:\n\n1. Click the "Forgot Password" link on the login page\n2. Enter your email address\n3. Check your email for the reset link\n4. Click the link and enter your new password\n\n**Note:** Password reset links expire after 24 hours.',
                    category_id: 2,
                    tags: ['password', 'security'],
                    company_ids: [],
                    is_public: true,
                    is_published: true,
                    created_by: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                {
                    id: 2,
                    title: 'VPN Setup Guide',
                    content: '## Setting Up VPN Access\n\n### Prerequisites\n- VPN client installed\n- Valid credentials from IT\n\n### Steps\n1. Open the VPN client\n2. Enter the server address: vpn.company.com\n3. Enter your username and password\n4. Click Connect\n\nIf you experience issues, please submit a support ticket.',
                    category_id: 4,
                    tags: ['vpn', 'network', 'setup'],
                    company_ids: [1, 3],
                    is_public: false,
                    is_published: true,
                    created_by: 1,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }
            ],
            tickets: [
                {
                    id: 1,
                    ticket_number: 'TKT-000001',
                    subject: 'Cannot connect to VPN from home',
                    description: 'I am unable to connect to the company VPN from my home network.',
                    status: 'in_progress',
                    priority: 'high',
                    category_id: 1,
                    customer_id: 1,
                    company_id: 1,
                    assigned_to: 2,
                    source: 'web',
                    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
                    updated_at: new Date(Date.now() - 2 * 3600000).toISOString()
                },
                {
                    id: 2,
                    ticket_number: 'TKT-000002',
                    subject: 'Need password reset for email account',
                    description: 'I forgot my email password and need help resetting it.',
                    status: 'open',
                    priority: 'medium',
                    category_id: 5,
                    customer_id: 3,
                    company_id: 2,
                    assigned_to: null,
                    source: 'web',
                    created_at: new Date(Date.now() - 8 * 3600000).toISOString(),
                    updated_at: new Date(Date.now() - 8 * 3600000).toISOString()
                },
                {
                    id: 3,
                    ticket_number: 'TKT-000003',
                    subject: 'Printer not working in conference room',
                    description: 'The printer in Conference Room A shows as offline.',
                    status: 'resolved',
                    priority: 'low',
                    category_id: 2,
                    customer_id: 4,
                    company_id: 3,
                    assigned_to: 3,
                    source: 'web',
                    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
                    updated_at: new Date(Date.now() - 12 * 3600000).toISOString(),
                    resolved_at: new Date(Date.now() - 12 * 3600000).toISOString()
                },
                {
                    id: 4,
                    ticket_number: 'TKT-000004',
                    subject: 'Server is down - URGENT',
                    description: 'Main application server is down. All employees affected.',
                    status: 'open',
                    priority: 'critical',
                    category_id: 1,
                    customer_id: 4,
                    company_id: 3,
                    assigned_to: null,
                    source: 'email',
                    created_at: new Date(Date.now() - 1 * 3600000).toISOString(),
                    updated_at: new Date(Date.now() - 1 * 3600000).toISOString()
                },
                {
                    id: 5,
                    ticket_number: 'TKT-000005',
                    subject: 'New employee workstation setup',
                    description: 'Need to set up a new workstation for a new hire starting Monday.',
                    status: 'open',
                    priority: 'medium',
                    category_id: 2,
                    customer_id: 2,
                    company_id: 1,
                    assigned_to: 2,
                    source: 'web',
                    created_at: new Date(Date.now() - 6 * 3600000).toISOString(),
                    updated_at: new Date(Date.now() - 6 * 3600000).toISOString()
                }
            ],
            replies: [
                {
                    id: 1,
                    ticket_id: 1,
                    author_type: 'customer',
                    author_id: 1,
                    content: 'I am unable to connect to the company VPN from my home network. I get "Connection timed out" after 30 seconds.',
                    is_internal: false,
                    created_at: new Date(Date.now() - 4 * 3600000).toISOString()
                },
                {
                    id: 2,
                    ticket_id: 1,
                    author_type: 'user',
                    author_id: 2,
                    content: 'Hi there,\n\nThank you for reaching out. Can you please confirm which VPN client you are using and what version?\n\nAlso, are you able to access other websites normally?\n\nBest regards,\nSarah',
                    is_internal: false,
                    created_at: new Date(Date.now() - 2 * 3600000).toISOString()
                },
                {
                    id: 3,
                    ticket_id: 2,
                    author_type: 'customer',
                    author_id: 3,
                    content: 'I forgot my email password and need help resetting it.',
                    is_internal: false,
                    created_at: new Date(Date.now() - 8 * 3600000).toISOString()
                }
            ],
            sessions: [],
            nextIds: { company: 4, customer: 5, user: 4, ticket: 6, reply: 4, category: 7, kb_category: 8, kb_tag: 7, knowledge_base: 3 }
        };

        fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
        console.log('Database initialized with demo data');
    } else {
        // Migrate existing database if needed
        const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
        let needsSave = false;

        // Add companies if missing
        if (!db.companies) {
            db.companies = [];
            db.nextIds.company = 1;

            // Extract unique companies from customers
            const companyMap = {};
            db.customers.forEach(c => {
                if (c.company_name && !companyMap[c.company_name]) {
                    const companyId = db.nextIds.company++;
                    companyMap[c.company_name] = companyId;
                    db.companies.push({
                        id: companyId,
                        name: c.company_name,
                        industry: null,
                        address: null,
                        phone: c.phone,
                        notes: null,
                        is_active: true,
                        created_at: c.created_at || new Date().toISOString()
                    });
                }
            });

            // Update customers with company_id
            db.customers.forEach(c => {
                if (c.company_name) {
                    c.company_id = companyMap[c.company_name];
                    c.name = c.contact_name;
                    delete c.contact_name;
                    delete c.company_name;
                    c.is_primary = true;
                }
            });

            // Update tickets with company_id
            db.tickets.forEach(t => {
                const customer = db.customers.find(c => c.id === t.customer_id);
                if (customer) {
                    t.company_id = customer.company_id;
                }
            });

            needsSave = true;
            console.log('Database migrated: added companies');
        }

        if (needsSave) {
            fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        }
    }
}

// Read/Write database
function readDB() {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Initialize
initDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// ==================== AUTH MIDDLEWARE ====================

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const db = readDB();
    const session = db.sessions.find(s => s.token === token && new Date(s.expires_at) > new Date());

    if (!session) {
        return res.status(401).json({ success: false, message: 'Invalid or expired session' });
    }

    if (session.user_type === 'customer') {
        req.user = db.customers.find(c => c.id === session.user_id);
        req.user.type = 'customer';
        // Add company info
        const company = db.companies.find(co => co.id === req.user.company_id);
        req.user.company = company;
    } else {
        req.user = db.users.find(u => u.id === session.user_id);
        req.user.type = 'user';
    }

    next();
}

// ==================== AUTH ROUTES ====================

app.post('/api/auth/customer/login', (req, res) => {
    const { email, password } = req.body;
    const db = readDB();

    const customer = db.customers.find(c => c.email === email && c.is_active);

    if (!customer || !bcrypt.compareSync(password, customer.password_hash)) {
        return res.json({ success: false, message: 'Invalid email or password' });
    }

    const company = db.companies.find(co => co.id === customer.company_id);

    const token = uuidv4();
    const session = {
        token,
        user_type: 'customer',
        user_id: customer.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    db.sessions.push(session);
    writeDB(db);

    res.json({
        success: true,
        data: {
            token,
            user: {
                id: customer.id,
                company_id: customer.company_id,
                company_name: company ? company.name : 'Unknown',
                contact_name: customer.name,
                email: customer.email,
                phone: customer.phone
            }
        }
    });
});

app.post('/api/auth/user/login', (req, res) => {
    const { email, password } = req.body;
    const db = readDB();

    const user = db.users.find(u => u.email === email && u.is_active);

    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.json({ success: false, message: 'Invalid email or password' });
    }

    const token = uuidv4();
    const session = {
        token,
        user_type: 'user',
        user_id: user.id,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    db.sessions.push(session);
    writeDB(db);

    res.json({
        success: true,
        data: {
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        }
    });
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    const db = readDB();
    db.sessions = db.sessions.filter(s => s.token !== token);
    writeDB(db);

    res.json({ success: true });
});

// ==================== COMPANY ROUTES ====================

app.get('/api/companies', authenticateToken, (req, res) => {
    if (req.user.type === 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const db = readDB();
    const companies = db.companies.map(co => {
        const customerCount = db.customers.filter(c => c.company_id === co.id && c.is_active).length;
        const openTickets = db.tickets.filter(t =>
            t.company_id === co.id &&
            !['closed', 'resolved'].includes(t.status)
        ).length;

        return {
            ...co,
            customer_count: customerCount,
            open_tickets: openTickets
        };
    });

    res.json({ success: true, data: companies });
});

app.get('/api/companies/:id', authenticateToken, (req, res) => {
    if (req.user.type === 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const db = readDB();
    const company = db.companies.find(co => co.id === parseInt(req.params.id));

    if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const customers = db.customers.filter(c => c.company_id === company.id);
    const tickets = db.tickets.filter(t => t.company_id === company.id);

    res.json({
        success: true,
        data: {
            ...company,
            customers,
            ticket_count: tickets.length,
            open_tickets: tickets.filter(t => !['closed', 'resolved'].includes(t.status)).length
        }
    });
});

app.post('/api/companies', authenticateToken, (req, res) => {
    if (req.user.type === 'customer' || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { name, industry, address, phone, notes } = req.body;
    const db = readDB();

    if (!name || name.trim().length === 0) {
        return res.json({ success: false, message: 'Company name is required' });
    }

    if (db.companies.find(co => co.name.toLowerCase() === name.toLowerCase())) {
        return res.json({ success: false, message: 'Company already exists' });
    }

    const companyId = db.nextIds.company++;
    const company = {
        id: companyId,
        name: name.trim(),
        industry: industry ? industry.trim() : null,
        address: address ? address.trim() : null,
        phone: phone ? phone.trim() : null,
        notes: notes ? notes.trim() : null,
        is_active: true,
        created_at: new Date().toISOString()
    };

    db.companies.push(company);
    writeDB(db);

    console.log(`[COMPANY] Created company: ${name}`);

    res.json({ success: true, data: company });
});

app.patch('/api/companies/:id', authenticateToken, (req, res) => {
    if (req.user.type === 'customer' || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const db = readDB();
    const company = db.companies.find(co => co.id === parseInt(req.params.id));

    if (!company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
    }

    const { name, industry, address, phone, notes, is_active } = req.body;

    if (name !== undefined) company.name = name.trim();
    if (industry !== undefined) company.industry = industry ? industry.trim() : null;
    if (address !== undefined) company.address = address ? address.trim() : null;
    if (phone !== undefined) company.phone = phone ? phone.trim() : null;
    if (notes !== undefined) company.notes = notes ? notes.trim() : null;
    if (is_active !== undefined) company.is_active = is_active;

    writeDB(db);

    res.json({ success: true, data: company });
});

// ==================== TICKET ROUTES ====================

app.get('/api/tickets', authenticateToken, (req, res) => {
    const db = readDB();
    let tickets = db.tickets;

    // Filter by company_id if provided
    if (req.query.company_id) {
        tickets = tickets.filter(t => t.company_id === parseInt(req.query.company_id));
    }

    if (req.user.type === 'customer') {
        // Customers see all tickets from their company
        tickets = tickets.filter(t => t.company_id === req.user.company_id);
    }

    // Enrich with related data
    tickets = tickets.map(t => {
        const customer = db.customers.find(c => c.id === t.customer_id);
        const company = db.companies.find(co => co.id === t.company_id);
        const assignee = db.users.find(u => u.id === t.assigned_to);
        const category = db.categories.find(c => c.id === t.category_id);

        return {
            ...t,
            customer_name: customer ? customer.name : 'Unknown',
            company_name: company ? company.name : 'Unknown',
            assigned_to_name: assignee ? assignee.name : null,
            category_name: category ? category.name : null
        };
    });

    tickets.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ success: true, data: tickets });
});

app.get('/api/tickets/:id', authenticateToken, (req, res) => {
    const db = readDB();
    const ticket = db.tickets.find(t => t.id === parseInt(req.params.id));

    if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (req.user.type === 'customer' && ticket.company_id !== req.user.company_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const customer = db.customers.find(c => c.id === ticket.customer_id);
    const company = db.companies.find(co => co.id === ticket.company_id);
    const assignee = db.users.find(u => u.id === ticket.assigned_to);
    const category = db.categories.find(c => c.id === ticket.category_id);

    let replies = db.replies.filter(r => r.ticket_id === ticket.id);
    if (req.user.type === 'customer') {
        replies = replies.filter(r => !r.is_internal);
    }

    replies = replies.map(r => {
        let author_name;
        if (r.author_type === 'customer') {
            const c = db.customers.find(c => c.id === r.author_id);
            author_name = c ? c.name : 'Unknown';
        } else {
            const u = db.users.find(u => u.id === r.author_id);
            author_name = u ? u.name : 'Unknown';
        }
        return { ...r, author_name };
    });

    res.json({
        success: true,
        data: {
            ...ticket,
            customer_name: customer ? customer.name : 'Unknown',
            customer_email: customer ? customer.email : null,
            company_name: company ? company.name : 'Unknown',
            assigned_to_name: assignee ? assignee.name : null,
            category_name: category ? category.name : null,
            replies
        }
    });
});

app.post('/api/tickets', authenticateToken, (req, res) => {
    const { subject, description, priority, category_id } = req.body;

    if (req.user.type !== 'customer') {
        return res.status(403).json({ success: false, message: 'Only customers can create tickets' });
    }

    const db = readDB();
    const ticketId = db.nextIds.ticket++;
    const ticketNumber = `TKT-${String(ticketId).padStart(6, '0')}`;

    const ticket = {
        id: ticketId,
        ticket_number: ticketNumber,
        subject,
        description,
        status: 'open',
        priority: priority || 'medium',
        category_id: category_id || null,
        customer_id: req.user.id,
        company_id: req.user.company_id,
        assigned_to: null,
        source: 'web',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    db.tickets.push(ticket);

    // Add initial reply
    const replyId = db.nextIds.reply++;
    db.replies.push({
        id: replyId,
        ticket_id: ticketId,
        author_type: 'customer',
        author_id: req.user.id,
        content: description,
        is_internal: false,
        created_at: new Date().toISOString()
    });

    writeDB(db);

    res.json({ success: true, data: ticket });
});

app.patch('/api/tickets/:id', authenticateToken, (req, res) => {
    if (req.user.type === 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const db = readDB();
    const ticket = db.tickets.find(t => t.id === parseInt(req.params.id));

    if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    const { status, priority, assigned_to } = req.body;

    if (status) ticket.status = status;
    if (priority) ticket.priority = priority;
    if (assigned_to !== undefined) ticket.assigned_to = assigned_to;

    ticket.updated_at = new Date().toISOString();

    if (status === 'resolved') ticket.resolved_at = new Date().toISOString();
    if (status === 'closed') ticket.closed_at = new Date().toISOString();

    writeDB(db);

    res.json({ success: true, data: ticket });
});

app.post('/api/tickets/:id/replies', authenticateToken, (req, res) => {
    const { content, is_internal } = req.body;
    const ticketId = parseInt(req.params.id);

    const db = readDB();
    const ticket = db.tickets.find(t => t.id === ticketId);

    if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (req.user.type === 'customer' && ticket.company_id !== req.user.company_id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const replyId = db.nextIds.reply++;
    db.replies.push({
        id: replyId,
        ticket_id: ticketId,
        author_type: req.user.type === 'customer' ? 'customer' : 'user',
        author_id: req.user.id,
        content,
        is_internal: req.user.type === 'customer' ? false : (is_internal || false),
        created_at: new Date().toISOString()
    });

    // Update ticket status
    if (req.user.type !== 'customer' && !is_internal && ticket.status === 'open') {
        ticket.status = 'waiting_on_customer';
    }
    if (req.user.type === 'customer' && ticket.status === 'waiting_on_customer') {
        ticket.status = 'in_progress';
    }
    ticket.updated_at = new Date().toISOString();

    writeDB(db);

    res.json({ success: true });
});

// ==================== CUSTOMER ROUTES ====================

app.get('/api/customers', authenticateToken, (req, res) => {
    if (req.user.type === 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const db = readDB();

    // Filter by company if provided
    let customers = db.customers;
    if (req.query.company_id) {
        customers = customers.filter(c => c.company_id === parseInt(req.query.company_id));
    }

    customers = customers.map(c => {
        const company = db.companies.find(co => co.id === c.company_id);
        const openTickets = db.tickets.filter(t =>
            t.customer_id === c.id &&
            !['closed', 'resolved'].includes(t.status)
        ).length;

        return {
            id: c.id,
            company_id: c.company_id,
            company_name: company ? company.name : 'Unknown',
            name: c.name,
            email: c.email,
            phone: c.phone,
            role: c.role,
            is_primary: c.is_primary,
            is_active: c.is_active,
            open_tickets: openTickets,
            created_at: c.created_at
        };
    });

    res.json({ success: true, data: customers });
});

app.post('/api/customers', authenticateToken, (req, res) => {
    if (req.user.type === 'customer' || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { company_id, name, email, phone, role, is_primary } = req.body;
    const db = readDB();

    if (!company_id) {
        return res.json({ success: false, message: 'Company is required' });
    }

    const company = db.companies.find(co => co.id === parseInt(company_id));
    if (!company) {
        return res.json({ success: false, message: 'Company not found' });
    }

    if (db.customers.find(c => c.email === email)) {
        return res.json({ success: false, message: 'Email already exists' });
    }

    const customerId = db.nextIds.customer++;
    const customer = {
        id: customerId,
        company_id: parseInt(company_id),
        name,
        email,
        password_hash: bcrypt.hashSync('welcome123', 10),
        phone: phone || null,
        role: role || null,
        is_primary: is_primary || false,
        is_active: true,
        created_at: new Date().toISOString()
    };

    db.customers.push(customer);
    writeDB(db);

    console.log(`[EMAIL] Would send welcome email to ${email} with password: welcome123`);

    res.json({
        success: true,
        data: {
            ...customer,
            company_name: company.name
        }
    });
});

app.patch('/api/customers/:id', authenticateToken, (req, res) => {
    if (req.user.type === 'customer' || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const db = readDB();
    const customer = db.customers.find(c => c.id === parseInt(req.params.id));

    if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const { name, phone, role, is_primary, is_active } = req.body;

    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;
    if (role !== undefined) customer.role = role;
    if (is_primary !== undefined) customer.is_primary = is_primary;
    if (is_active !== undefined) customer.is_active = is_active;

    writeDB(db);

    res.json({ success: true, data: customer });
});

// Customer self-service profile update
app.patch('/api/customers/me', authenticateToken, (req, res) => {
    if (req.user.type !== 'customer') {
        return res.status(403).json({ success: false, message: 'Customer access only' });
    }

    const db = readDB();
    const customer = db.customers.find(c => c.id === req.user.id);

    if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const { name, phone } = req.body;

    if (name !== undefined) customer.name = name;
    if (phone !== undefined) customer.phone = phone;

    writeDB(db);

    const company = db.companies.find(co => co.id === customer.company_id);

    res.json({
        success: true,
        data: {
            id: customer.id,
            company_id: customer.company_id,
            company_name: company ? company.name : 'Unknown',
            contact_name: customer.name,
            email: customer.email,
            phone: customer.phone
        }
    });
});

// Customer self-service password change
app.put('/api/customers/me/password', authenticateToken, (req, res) => {
    if (req.user.type !== 'customer') {
        return res.status(403).json({ success: false, message: 'Customer access only' });
    }

    const { current_password, new_password } = req.body;
    const db = readDB();
    const customer = db.customers.find(c => c.id === req.user.id);

    if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    if (!bcrypt.compareSync(current_password, customer.password_hash)) {
        return res.json({ success: false, message: 'Current password is incorrect' });
    }

    if (!new_password || new_password.length < 8) {
        return res.json({ success: false, message: 'New password must be at least 8 characters' });
    }

    customer.password_hash = bcrypt.hashSync(new_password, 10);
    writeDB(db);

    res.json({ success: true, message: 'Password updated successfully' });
});

// ==================== USERS ROUTES ====================

app.get('/api/users', authenticateToken, (req, res) => {
    if (req.user.type === 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const db = readDB();
    const users = db.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        is_active: u.is_active
    }));

    res.json({ success: true, data: users });
});

app.post('/api/users', authenticateToken, (req, res) => {
    if (req.user.type === 'customer' || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { name, email, role, password } = req.body;
    const db = readDB();

    if (db.users.find(u => u.email === email)) {
        return res.json({ success: false, message: 'Email already exists' });
    }

    if (!password || password.length < 6) {
        return res.json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const userId = db.nextIds.user++;
    const user = {
        id: userId,
        name,
        email,
        password_hash: bcrypt.hashSync(password, 10),
        role: role || 'technician',
        is_active: true,
        created_at: new Date().toISOString()
    };

    db.users.push(user);
    writeDB(db);

    console.log(`[USER] Created team member: ${name} (${email}) as ${role}`);

    res.json({
        success: true,
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            is_active: user.is_active
        }
    });
});

// Bulk import users from CSV
app.post('/api/users/bulk', authenticateToken, (req, res) => {
    if (req.user.type === 'customer' || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
        return res.json({ success: false, message: 'No users provided' });
    }

    const db = readDB();
    const results = {
        success: [],
        errors: []
    };

    users.forEach((userData, index) => {
        const rowNum = index + 2; // Account for header row

        // Validate required fields
        if (!userData.name || !userData.name.trim()) {
            results.errors.push({ row: rowNum, email: userData.email || 'N/A', error: 'Name is required' });
            return;
        }

        if (!userData.email || !userData.email.trim()) {
            results.errors.push({ row: rowNum, email: 'N/A', error: 'Email is required' });
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email.trim())) {
            results.errors.push({ row: rowNum, email: userData.email, error: 'Invalid email format' });
            return;
        }

        // Check for duplicate email
        if (db.users.find(u => u.email.toLowerCase() === userData.email.trim().toLowerCase())) {
            results.errors.push({ row: rowNum, email: userData.email, error: 'Email already exists' });
            return;
        }

        // Validate role
        const role = (userData.role || 'technician').toLowerCase().trim();
        if (!['admin', 'technician'].includes(role)) {
            results.errors.push({ row: rowNum, email: userData.email, error: 'Invalid role (must be admin or technician)' });
            return;
        }

        // Validate password
        const password = userData.password || 'Welcome123!';
        if (password.length < 6) {
            results.errors.push({ row: rowNum, email: userData.email, error: 'Password must be at least 6 characters' });
            return;
        }

        // Create user
        const userId = db.nextIds.user++;
        const user = {
            id: userId,
            name: userData.name.trim(),
            email: userData.email.trim().toLowerCase(),
            password_hash: bcrypt.hashSync(password, 10),
            role: role,
            is_active: true,
            created_at: new Date().toISOString()
        };

        db.users.push(user);
        results.success.push({
            row: rowNum,
            name: user.name,
            email: user.email,
            role: user.role
        });
    });

    writeDB(db);

    console.log(`[BULK IMPORT] Created ${results.success.length} users, ${results.errors.length} errors`);

    res.json({
        success: true,
        data: {
            created: results.success.length,
            failed: results.errors.length,
            results
        }
    });
});

app.patch('/api/users/:id', authenticateToken, (req, res) => {
    if (req.user.type === 'customer' || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const db = readDB();
    const user = db.users.find(u => u.id === parseInt(req.params.id));

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.id === req.user.id && req.body.is_active === false) {
        return res.json({ success: false, message: 'Cannot deactivate your own account' });
    }

    const { name, role, is_active } = req.body;

    if (name !== undefined) user.name = name;
    if (role !== undefined) user.role = role;
    if (is_active !== undefined) user.is_active = is_active;

    writeDB(db);

    res.json({
        success: true,
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            is_active: user.is_active
        }
    });
});

app.patch('/api/users/me', authenticateToken, (req, res) => {
    if (req.user.type === 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const db = readDB();
    const user = db.users.find(u => u.id === req.user.id);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name } = req.body;

    if (name !== undefined) user.name = name;

    writeDB(db);

    res.json({
        success: true,
        data: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        }
    });
});

app.put('/api/users/me/password', authenticateToken, (req, res) => {
    if (req.user.type === 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { current_password, new_password } = req.body;
    const db = readDB();
    const user = db.users.find(u => u.id === req.user.id);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!bcrypt.compareSync(current_password, user.password_hash)) {
        return res.json({ success: false, message: 'Current password is incorrect' });
    }

    if (!new_password || new_password.length < 6) {
        return res.json({ success: false, message: 'New password must be at least 6 characters' });
    }

    user.password_hash = bcrypt.hashSync(new_password, 10);
    writeDB(db);

    res.json({ success: true, message: 'Password updated successfully' });
});

// ==================== CATEGORIES ====================

app.get('/api/categories', authenticateToken, (req, res) => {
    const db = readDB();
    res.json({ success: true, data: db.categories.filter(c => c.is_active) });
});

app.post('/api/categories', authenticateToken, (req, res) => {
    if (req.user.type === 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { name, description } = req.body;
    const db = readDB();

    if (!name || name.trim().length === 0) {
        return res.json({ success: false, message: 'Category name is required' });
    }

    if (db.categories.find(c => c.name.toLowerCase() === name.toLowerCase())) {
        return res.json({ success: false, message: 'Category already exists' });
    }

    const categoryId = db.nextIds.category++;
    const category = {
        id: categoryId,
        name: name.trim(),
        description: description ? description.trim() : null,
        is_active: true
    };

    db.categories.push(category);
    writeDB(db);

    res.json({ success: true, data: category });
});

// ==================== KNOWLEDGE BASE ====================

// Get KB categories (with hierarchy info)
app.get('/api/kb-categories', authenticateToken, (req, res) => {
    const db = readDB();
    if (!db.kb_categories) {
        return res.json({ success: true, data: [] });
    }

    const categories = db.kb_categories.filter(c => c.is_active).map(cat => {
        const parent = cat.parent_id ? db.kb_categories.find(p => p.id === cat.parent_id) : null;
        const children = db.kb_categories.filter(c => c.parent_id === cat.id && c.is_active);
        return {
            ...cat,
            parent_name: parent ? parent.name : null,
            children_count: children.length
        };
    });

    res.json({ success: true, data: categories });
});

// Create KB category
app.post('/api/kb-categories', authenticateToken, (req, res) => {
    if (req.user.type === 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { name, description, parent_id } = req.body;
    const db = readDB();

    if (!db.kb_categories) db.kb_categories = [];
    if (!db.nextIds.kb_category) db.nextIds.kb_category = 1;

    if (!name || name.trim().length === 0) {
        return res.json({ success: false, message: 'Category name is required' });
    }

    // Check for duplicate name at same level
    const existingCategory = db.kb_categories.find(c =>
        c.name.toLowerCase() === name.toLowerCase() &&
        c.parent_id === (parent_id || null)
    );
    if (existingCategory) {
        return res.json({ success: false, message: 'Category already exists at this level' });
    }

    // Validate parent exists if provided
    if (parent_id) {
        const parent = db.kb_categories.find(c => c.id === parent_id);
        if (!parent) {
            return res.json({ success: false, message: 'Parent category not found' });
        }
    }

    const categoryId = db.nextIds.kb_category++;
    const category = {
        id: categoryId,
        name: name.trim(),
        description: description ? description.trim() : null,
        parent_id: parent_id || null,
        is_active: true
    };

    db.kb_categories.push(category);
    writeDB(db);

    res.json({ success: true, data: category });
});

// Update KB category
app.patch('/api/kb-categories/:id', authenticateToken, (req, res) => {
    if (req.user.type === 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const db = readDB();
    const category = db.kb_categories.find(c => c.id === parseInt(req.params.id));

    if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const { name, description, parent_id } = req.body;

    // Prevent setting self as parent
    if (parent_id === category.id) {
        return res.json({ success: false, message: 'Category cannot be its own parent' });
    }

    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description ? description.trim() : null;
    if (parent_id !== undefined) category.parent_id = parent_id;

    writeDB(db);

    res.json({ success: true, data: category });
});

// ==================== KB TAGS ====================

// Get all tags
app.get('/api/kb-tags', authenticateToken, (req, res) => {
    const db = readDB();
    if (!db.kb_tags) {
        return res.json({ success: true, data: [] });
    }

    // Add usage count to each tag
    const tags = db.kb_tags.map(tag => {
        const usageCount = db.knowledge_base ?
            db.knowledge_base.filter(a => a.tags && a.tags.includes(tag.name)).length : 0;
        return { ...tag, usage_count: usageCount };
    });

    res.json({ success: true, data: tags });
});

// Create tag
app.post('/api/kb-tags', authenticateToken, (req, res) => {
    if (req.user.type === 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { name, color } = req.body;
    const db = readDB();

    if (!db.kb_tags) db.kb_tags = [];
    if (!db.nextIds.kb_tag) db.nextIds.kb_tag = 1;

    if (!name || name.trim().length === 0) {
        return res.json({ success: false, message: 'Tag name is required' });
    }

    const tagName = name.trim().toLowerCase().replace(/\s+/g, '-');

    if (db.kb_tags.find(t => t.name === tagName)) {
        return res.json({ success: false, message: 'Tag already exists' });
    }

    const tagId = db.nextIds.kb_tag++;
    const tag = {
        id: tagId,
        name: tagName,
        color: color || '#6b7280'
    };

    db.kb_tags.push(tag);
    writeDB(db);

    res.json({ success: true, data: tag });
});

// Update tag
app.patch('/api/kb-tags/:id', authenticateToken, (req, res) => {
    if (req.user.type === 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const db = readDB();
    const tag = db.kb_tags.find(t => t.id === parseInt(req.params.id));

    if (!tag) {
        return res.status(404).json({ success: false, message: 'Tag not found' });
    }

    const { name, color } = req.body;
    const oldName = tag.name;

    if (name !== undefined) {
        const newName = name.trim().toLowerCase().replace(/\s+/g, '-');
        // Update tag name in all articles that use it
        if (db.knowledge_base) {
            db.knowledge_base.forEach(article => {
                if (article.tags && article.tags.includes(oldName)) {
                    article.tags = article.tags.map(t => t === oldName ? newName : t);
                }
            });
        }
        tag.name = newName;
    }
    if (color !== undefined) tag.color = color;

    writeDB(db);

    res.json({ success: true, data: tag });
});

// Delete tag
app.delete('/api/kb-tags/:id', authenticateToken, (req, res) => {
    if (req.user.type === 'customer' || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const db = readDB();
    const tagIndex = db.kb_tags.findIndex(t => t.id === parseInt(req.params.id));

    if (tagIndex === -1) {
        return res.status(404).json({ success: false, message: 'Tag not found' });
    }

    const tagName = db.kb_tags[tagIndex].name;

    // Remove tag from all articles
    if (db.knowledge_base) {
        db.knowledge_base.forEach(article => {
            if (article.tags) {
                article.tags = article.tags.filter(t => t !== tagName);
            }
        });
    }

    db.kb_tags.splice(tagIndex, 1);
    writeDB(db);

    res.json({ success: true });
});

// Get knowledge base articles
app.get('/api/knowledge-base', authenticateToken, (req, res) => {
    const db = readDB();

    if (!db.knowledge_base) {
        return res.json({ success: true, data: [] });
    }

    let articles = db.knowledge_base;

    // For customers, only show published articles that are public or assigned to their company
    if (req.user.type === 'customer') {
        articles = articles.filter(article => {
            if (!article.is_published) return false;
            if (article.is_public) return true;
            if (article.company_ids && article.company_ids.includes(req.user.company_id)) return true;
            return false;
        });
    }

    // Enrich with category, author, and tag info
    articles = articles.map(article => {
        const category = db.kb_categories ? db.kb_categories.find(c => c.id === article.category_id) : null;
        const author = db.users.find(u => u.id === article.created_by);

        // Build category path (for hierarchical display)
        let categoryPath = [];
        if (category) {
            let current = category;
            while (current) {
                categoryPath.unshift(current.name);
                current = current.parent_id ? db.kb_categories.find(c => c.id === current.parent_id) : null;
            }
        }

        // Get company names for assigned companies
        const companyNames = article.company_ids && article.company_ids.length > 0
            ? article.company_ids.map(id => {
                const company = db.companies.find(c => c.id === id);
                return company ? company.name : 'Unknown';
            })
            : [];

        // Get tag info with colors
        const tagInfo = article.tags && db.kb_tags
            ? article.tags.map(tagName => {
                const tag = db.kb_tags.find(t => t.name === tagName);
                return tag ? { name: tag.name, color: tag.color } : { name: tagName, color: '#6b7280' };
            })
            : [];

        return {
            ...article,
            category_name: category ? category.name : null,
            category_path: categoryPath,
            author_name: author ? author.name : 'Unknown',
            company_names: companyNames,
            tag_info: tagInfo
        };
    });

    // Sort by updated_at desc
    articles.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    res.json({ success: true, data: articles });
});

// Get single knowledge base article
app.get('/api/knowledge-base/:id', authenticateToken, (req, res) => {
    const db = readDB();

    if (!db.knowledge_base) {
        return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const article = db.knowledge_base.find(a => a.id === parseInt(req.params.id));

    if (!article) {
        return res.status(404).json({ success: false, message: 'Article not found' });
    }

    // Check access for customers
    if (req.user.type === 'customer') {
        if (!article.is_published) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        if (!article.is_public && (!article.company_ids || !article.company_ids.includes(req.user.company_id))) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
    }

    const category = db.kb_categories ? db.kb_categories.find(c => c.id === article.category_id) : null;
    const author = db.users.find(u => u.id === article.created_by);

    // Build category path
    let categoryPath = [];
    if (category) {
        let current = category;
        while (current) {
            categoryPath.unshift(current.name);
            current = current.parent_id ? db.kb_categories.find(c => c.id === current.parent_id) : null;
        }
    }

    const companyNames = article.company_ids && article.company_ids.length > 0
        ? article.company_ids.map(id => {
            const company = db.companies.find(c => c.id === id);
            return company ? company.name : 'Unknown';
        })
        : [];

    // Get tag info with colors
    const tagInfo = article.tags && db.kb_tags
        ? article.tags.map(tagName => {
            const tag = db.kb_tags.find(t => t.name === tagName);
            return tag ? { name: tag.name, color: tag.color } : { name: tagName, color: '#6b7280' };
        })
        : [];

    res.json({
        success: true,
        data: {
            ...article,
            category_name: category ? category.name : null,
            category_path: categoryPath,
            author_name: author ? author.name : 'Unknown',
            company_names: companyNames,
            tag_info: tagInfo
        }
    });
});

// Create knowledge base article
app.post('/api/knowledge-base', authenticateToken, (req, res) => {
    if (req.user.type === 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { title, content, category_id, tags, company_ids, is_public, is_published } = req.body;
    const db = readDB();

    if (!db.knowledge_base) db.knowledge_base = [];
    if (!db.nextIds.knowledge_base) db.nextIds.knowledge_base = 1;

    if (!title || title.trim().length === 0) {
        return res.json({ success: false, message: 'Title is required' });
    }

    if (!content || content.trim().length === 0) {
        return res.json({ success: false, message: 'Content is required' });
    }

    const articleId = db.nextIds.knowledge_base++;
    const article = {
        id: articleId,
        title: title.trim(),
        content: content.trim(),
        category_id: category_id || null,
        tags: tags || [],
        company_ids: company_ids || [],
        is_public: is_public !== false,
        is_published: is_published !== false,
        created_by: req.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    db.knowledge_base.push(article);
    writeDB(db);

    console.log(`[KB] Created article: ${title}`);

    res.json({ success: true, data: article });
});

// Update knowledge base article
app.patch('/api/knowledge-base/:id', authenticateToken, (req, res) => {
    if (req.user.type === 'customer') {
        return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const db = readDB();

    if (!db.knowledge_base) {
        return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const article = db.knowledge_base.find(a => a.id === parseInt(req.params.id));

    if (!article) {
        return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const { title, content, category_id, tags, company_ids, is_public, is_published } = req.body;

    if (title !== undefined) article.title = title.trim();
    if (content !== undefined) article.content = content.trim();
    if (tags !== undefined) article.tags = tags;
    if (category_id !== undefined) article.category_id = category_id;
    if (company_ids !== undefined) article.company_ids = company_ids;
    if (is_public !== undefined) article.is_public = is_public;
    if (is_published !== undefined) article.is_published = is_published;

    article.updated_at = new Date().toISOString();

    writeDB(db);

    res.json({ success: true, data: article });
});

// Delete knowledge base article
app.delete('/api/knowledge-base/:id', authenticateToken, (req, res) => {
    if (req.user.type === 'customer' || req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const db = readDB();

    if (!db.knowledge_base) {
        return res.status(404).json({ success: false, message: 'Article not found' });
    }

    const articleIndex = db.knowledge_base.findIndex(a => a.id === parseInt(req.params.id));

    if (articleIndex === -1) {
        return res.status(404).json({ success: false, message: 'Article not found' });
    }

    db.knowledge_base.splice(articleIndex, 1);
    writeDB(db);

    res.json({ success: true });
});

// ==================== EMAIL WEBHOOK (AWS SES via SNS) ====================

// Handle SNS subscription confirmation and email notifications
app.post('/api/email/webhook', express.text({ type: '*/*' }), async (req, res) => {
    try {
        const message = JSON.parse(req.body);

        // Handle SNS subscription confirmation
        if (message.Type === 'SubscriptionConfirmation') {
            console.log('[EMAIL] SNS Subscription confirmation received');
            console.log('[EMAIL] Confirm URL:', message.SubscribeURL);
            // Auto-confirm by fetching the URL
            const https = require('https');
            https.get(message.SubscribeURL, (response) => {
                console.log('[EMAIL] Subscription confirmed');
            });
            return res.status(200).send('OK');
        }

        // Handle actual email notification
        if (message.Type === 'Notification') {
            const notification = JSON.parse(message.Message);
            const mail = notification.mail;
            const content = notification.content; // Base64 encoded email

            // Parse email headers
            const from = mail.source;
            const to = mail.destination[0];
            const subject = mail.commonHeaders.subject || 'No Subject';
            const fromAddress = mail.commonHeaders.from[0];

            // Extract email body (simplified - in production use a proper email parser)
            let body = '';
            if (content) {
                const decoded = Buffer.from(content, 'base64').toString('utf-8');
                // Simple extraction - get text after headers
                const parts = decoded.split('\r\n\r\n');
                body = parts.slice(1).join('\r\n\r\n');
                // Strip HTML if present
                body = body.replace(/<[^>]*>/g, '').trim();
            }

            console.log(`[EMAIL] Received email from: ${fromAddress}, subject: ${subject}`);

            const db = readDB();

            // Check if this is a reply to an existing ticket (look for ticket number in subject)
            const ticketMatch = subject.match(/\[TKT-(\d+)\]/);

            if (ticketMatch) {
                // This is a reply to an existing ticket
                const ticketNumber = `TKT-${ticketMatch[1]}`;
                const ticket = db.tickets.find(t => t.ticket_number === ticketNumber);

                if (ticket) {
                    // Find customer by email
                    const customer = db.customers.find(c =>
                        fromAddress.toLowerCase().includes(c.email.toLowerCase())
                    );

                    // Add reply to ticket
                    const replyId = db.nextIds.reply++;
                    db.replies.push({
                        id: replyId,
                        ticket_id: ticket.id,
                        author_type: customer ? 'customer' : 'user',
                        author_id: customer ? customer.id : null,
                        content: body || 'Email reply (no content)',
                        is_internal: false,
                        source: 'email',
                        created_at: new Date().toISOString()
                    });

                    // Update ticket status if it was waiting on customer
                    if (ticket.status === 'waiting_on_customer') {
                        ticket.status = 'in_progress';
                    }
                    ticket.updated_at = new Date().toISOString();

                    writeDB(db);
                    console.log(`[EMAIL] Added reply to ticket ${ticketNumber}`);
                }
            } else {
                // This is a new ticket
                // Try to find customer by email
                const customer = db.customers.find(c =>
                    fromAddress.toLowerCase().includes(c.email.toLowerCase())
                );

                const ticketId = db.nextIds.ticket++;
                const ticketNumber = `TKT-${String(ticketId).padStart(6, '0')}`;

                const ticket = {
                    id: ticketId,
                    ticket_number: ticketNumber,
                    subject: subject,
                    description: body || 'Email ticket (no content)',
                    status: 'open',
                    priority: 'medium',
                    category_id: null,
                    customer_id: customer ? customer.id : null,
                    company_id: customer ? customer.company_id : null,
                    assigned_to: null,
                    source: 'email',
                    source_email: fromAddress,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                };

                db.tickets.push(ticket);

                // Add initial reply
                const replyId = db.nextIds.reply++;
                db.replies.push({
                    id: replyId,
                    ticket_id: ticketId,
                    author_type: 'customer',
                    author_id: customer ? customer.id : null,
                    content: body || 'Email ticket (no content)',
                    is_internal: false,
                    source: 'email',
                    created_at: new Date().toISOString()
                });

                writeDB(db);
                console.log(`[EMAIL] Created new ticket ${ticketNumber} from ${fromAddress}`);

                // If unknown sender, log for team review
                if (!customer) {
                    console.log(`[EMAIL] WARNING: Unknown sender ${fromAddress} - ticket needs customer assignment`);
                }
            }

            return res.status(200).send('OK');
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('[EMAIL] Webhook error:', error);
        res.status(500).send('Error processing email');
    }
});

// ==================== STATS ====================

app.get('/api/stats', authenticateToken, (req, res) => {
    const db = readDB();

    if (req.user.type === 'customer') {
        const userTickets = db.tickets.filter(t => t.company_id === req.user.company_id);
        res.json({
            success: true,
            data: {
                open: userTickets.filter(t => t.status === 'open').length,
                in_progress: userTickets.filter(t => t.status === 'in_progress').length,
                resolved: userTickets.filter(t => ['resolved', 'closed'].includes(t.status)).length,
                total: userTickets.length
            }
        });
    } else {
        const activeTickets = db.tickets.filter(t => !['resolved', 'closed'].includes(t.status));
        const today = new Date().toDateString();

        res.json({
            success: true,
            data: {
                open: activeTickets.filter(t => ['open', 'in_progress'].includes(t.status)).length,
                unassigned: activeTickets.filter(t => !t.assigned_to).length,
                resolved_today: db.tickets.filter(t =>
                    t.resolved_at && new Date(t.resolved_at).toDateString() === today
                ).length,
                high_priority: activeTickets.filter(t => ['high', 'critical'].includes(t.priority)).length
            }
        });
    }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Scottship Solutions Ticketing Portal                    ║
║                                                           ║
║   Server running at: http://localhost:${PORT}               ║
║                                                           ║
║   Customer Portal: http://localhost:${PORT}/customer/       ║
║   Team Portal:     http://localhost:${PORT}/team/           ║
║                                                           ║
║   Demo Accounts:                                          ║
║   ─────────────                                           ║
║   Customer: demo@customer.com / password123               ║
║   Team:     admin@scottship.com / admin123                ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
});
