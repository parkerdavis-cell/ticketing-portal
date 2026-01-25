/**
 * Database Setup Script
 * Run this once to create tables and seed demo data
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.join(__dirname, '..', 'database');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'ticketing.db');

// Remove existing database for fresh start
if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('Removed existing database');
}

const db = new Database(dbPath);

console.log('Setting up database...\n');

// Create tables
db.exec(`
    -- Customers (external clients)
    CREATE TABLE customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        phone TEXT,
        notes TEXT,
        is_active INTEGER DEFAULT 1,
        password_reset_token TEXT,
        password_reset_expires TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Users (internal team members)
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'technician')),
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Ticket Categories
    CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now'))
    );

    -- Tickets
    CREATE TABLE tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_number TEXT UNIQUE NOT NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_on_customer', 'resolved', 'closed')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
        category_id INTEGER REFERENCES categories(id),
        customer_id INTEGER NOT NULL REFERENCES customers(id),
        assigned_to INTEGER REFERENCES users(id),
        source TEXT DEFAULT 'web' CHECK (source IN ('web', 'email')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        resolved_at TEXT,
        closed_at TEXT
    );

    -- Ticket Replies
    CREATE TABLE ticket_replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
        author_type TEXT NOT NULL CHECK (author_type IN ('customer', 'user')),
        author_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        is_internal INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
    );

    -- Attachments
    CREATE TABLE attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
        reply_id INTEGER REFERENCES ticket_replies(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        mime_type TEXT,
        uploaded_by_type TEXT NOT NULL CHECK (uploaded_by_type IN ('customer', 'user')),
        uploaded_by_id INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
    );

    -- Sessions
    CREATE TABLE sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_token TEXT UNIQUE NOT NULL,
        user_type TEXT NOT NULL CHECK (user_type IN ('customer', 'user')),
        user_id INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
    );

    -- Indexes
    CREATE INDEX idx_tickets_customer ON tickets(customer_id);
    CREATE INDEX idx_tickets_assigned ON tickets(assigned_to);
    CREATE INDEX idx_tickets_status ON tickets(status);
    CREATE INDEX idx_replies_ticket ON ticket_replies(ticket_id);
    CREATE INDEX idx_sessions_token ON sessions(session_token);
`);

console.log('✓ Tables created\n');

// Seed categories
const categories = [
    { name: 'Network', description: 'Network connectivity and infrastructure issues' },
    { name: 'Hardware', description: 'Physical equipment and device issues' },
    { name: 'Software', description: 'Application and software-related issues' },
    { name: 'Security', description: 'Security concerns and access issues' },
    { name: 'Email', description: 'Email and communication issues' },
    { name: 'Other', description: 'General inquiries and other issues' },
];

const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
categories.forEach(cat => insertCategory.run(cat.name, cat.description));
console.log('✓ Categories created\n');

// Seed team users
const adminPassword = bcrypt.hashSync('admin123', 10);
const techPassword = bcrypt.hashSync('tech123', 10);

db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
`).run('Admin User', 'admin@scottship.com', adminPassword, 'admin');

db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
`).run('Sarah Tech', 'sarah@scottship.com', techPassword, 'technician');

db.prepare(`
    INSERT INTO users (name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
`).run('Mike Support', 'mike@scottship.com', techPassword, 'technician');

console.log('✓ Team users created');
console.log('  - admin@scottship.com / admin123 (Admin)');
console.log('  - sarah@scottship.com / tech123 (Technician)');
console.log('  - mike@scottship.com / tech123 (Technician)\n');

// Seed customers
const customerPassword = bcrypt.hashSync('password123', 10);

const customers = [
    { company: 'Acme Corporation', contact: 'John Smith', email: 'demo@customer.com', phone: '(555) 123-4567' },
    { company: 'Tech Startup Inc', contact: 'Sarah Johnson', email: 'sarah@techstartup.io', phone: '(555) 987-6543' },
    { company: 'Big Enterprise LLC', contact: 'Michael Brown', email: 'mbrown@bigenterprise.com', phone: '(555) 456-7890' },
];

const insertCustomer = db.prepare(`
    INSERT INTO customers (company_name, contact_name, email, password_hash, phone)
    VALUES (?, ?, ?, ?, ?)
`);

customers.forEach(c => insertCustomer.run(c.company, c.contact, c.email, customerPassword, c.phone));

console.log('✓ Customers created');
console.log('  - demo@customer.com / password123 (Acme Corporation)');
console.log('  - sarah@techstartup.io / password123 (Tech Startup Inc)');
console.log('  - mbrown@bigenterprise.com / password123 (Big Enterprise LLC)\n');

// Seed demo tickets
const tickets = [
    {
        number: 'TKT-000001',
        subject: 'Cannot connect to VPN from home',
        description: 'I am unable to connect to the company VPN from my home network. I get an error message saying "Connection timed out" after about 30 seconds of trying to connect.',
        status: 'in_progress',
        priority: 'high',
        category: 1,
        customer: 1,
        assigned: 2,
    },
    {
        number: 'TKT-000002',
        subject: 'Need password reset for email account',
        description: 'I forgot my email password and the self-service reset is not working. Can you please help me reset it?',
        status: 'open',
        priority: 'medium',
        category: 5,
        customer: 2,
        assigned: null,
    },
    {
        number: 'TKT-000003',
        subject: 'Printer not working in conference room',
        description: 'The printer in Conference Room A is not printing. It shows as offline even though it appears to be powered on.',
        status: 'resolved',
        priority: 'low',
        category: 2,
        customer: 3,
        assigned: 3,
    },
    {
        number: 'TKT-000004',
        subject: 'Server is down - URGENT',
        description: 'Our main application server appears to be down. All employees are unable to access the CRM system.',
        status: 'open',
        priority: 'critical',
        category: 1,
        customer: 3,
        assigned: null,
    },
    {
        number: 'TKT-000005',
        subject: 'Software license renewal needed',
        description: 'Our Microsoft Office licenses are expiring next month. Can you help us renew them?',
        status: 'waiting_on_customer',
        priority: 'medium',
        category: 3,
        customer: 1,
        assigned: 2,
    },
];

const insertTicket = db.prepare(`
    INSERT INTO tickets (ticket_number, subject, description, status, priority, category_id, customer_id, assigned_to, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
`);

const insertReply = db.prepare(`
    INSERT INTO ticket_replies (ticket_id, author_type, author_id, content, is_internal, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now', ?))
`);

tickets.forEach((t, i) => {
    const hoursAgo = `-${(i + 1) * 4} hours`;
    insertTicket.run(t.number, t.subject, t.description, t.status, t.priority, t.category, t.customer, t.assigned, hoursAgo);

    // Add initial message
    insertReply.run(i + 1, 'customer', t.customer, t.description, 0, hoursAgo);

    // Add some replies to first ticket
    if (i === 0) {
        insertReply.run(1, 'user', 2, `Hi there,

Thank you for reaching out. I'm looking into this issue now.

Can you please confirm which VPN client you are using and what version it is?

Also, are you able to access other websites normally from your home network?

Best regards,
Sarah`, 0, '-2 hours');
    }
});

console.log('✓ Demo tickets created\n');

db.close();

console.log('═══════════════════════════════════════════════════');
console.log('  Database setup complete!');
console.log('═══════════════════════════════════════════════════');
console.log('\n  Run the server with: npm start\n');
