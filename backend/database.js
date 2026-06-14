import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isPostgres = false;
let pgPool = null;

// Determine connection strategy
if (process.env.DATABASE_URL || process.env.PGHOST) {
  isPostgres = true;
  console.log('Database configuration: PostgreSQL detected.');
  pgPool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
    ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
      ? { rejectUnauthorized: false }
      : false
  });
} else {
  console.log('Database configuration: No PostgreSQL environment. Using JSON File-backed database (deskguard_db.json).');
}

// Local JSON Database implementation
const JSON_DB_PATH = path.resolve(__dirname, 'deskguard_db.json');

const loadJsonDb = () => {
  if (!fs.existsSync(JSON_DB_PATH)) {
    const defaultDb = {
      users: [],
      desks: [],
      sessions: [],
      notifications: []
    };
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf-8');
    return defaultDb;
  }
  try {
    const data = fs.readFileSync(JSON_DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading JSON DB file, creating fresh:', err);
    return { users: [], desks: [], sessions: [], notifications: [] };
  }
};

const saveJsonDb = (db) => {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving JSON DB:', err);
  }
};

// Unified Query Handler
export const query = async (text, params = []) => {
  if (isPostgres) {
    return new Promise((resolve, reject) => {
      pgPool.query(text, params, (err, res) => {
        if (err) return reject(err);
        resolve({ rows: res.rows, rowCount: res.rowCount });
      });
    });
  }

  // Pure JavaScript SQL query execution mock for local deskguard_db.json
  const db = loadJsonDb();
  const sql = text.trim().replace(/\s+/g, ' ');
  const sqlUpper = sql.toUpperCase();

  // 1. SELECT COUNT(*) as count FROM desks
  if (sqlUpper.includes('SELECT COUNT(*) AS COUNT FROM DESKS')) {
    return { rows: [{ count: db.desks.length, COUNT: db.desks.length }], rowCount: 1 };
  }

  // 2. SELECT COUNT(*) as count FROM users
  if (sqlUpper.includes('SELECT COUNT(*) AS COUNT FROM USERS')) {
    return { rows: [{ count: db.users.length, COUNT: db.users.length }], rowCount: 1 };
  }

  // 2b. SELECT COUNT(*) as count FROM sessions
  if (sqlUpper.includes('SELECT COUNT(*) AS COUNT FROM SESSIONS')) {
    return { rows: [{ count: db.sessions.length, COUNT: db.sessions.length }], rowCount: 1 };
  }

  // 3. INSERT INTO desks
  if (sqlUpper.startsWith('INSERT INTO DESKS')) {
    // INSERT INTO desks (id, name, zone, qr_code, status) VALUES ($1, $2, $3, $4, $5)
    const [id, name, zone, qr_code, status] = params;
    const newDesk = { id, name, zone, qr_code, status, current_session_id: null, created_at: new Date().toISOString() };
    db.desks.push(newDesk);
    saveJsonDb(db);
    return { rows: [newDesk], rowCount: 1 };
  }

  // 4. INSERT INTO users
  if (sqlUpper.startsWith('INSERT INTO USERS')) {
    // INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)
    const [username, email, password_hash, role] = params;
    const newId = db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1;
    const newUser = {
      id: newId,
      username,
      email,
      password_hash,
      role: role || 'student',
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    saveJsonDb(db);
    return { rows: [newUser], rowCount: 1 };
  }

  // 5. SELECT * FROM users WHERE username = $1 OR email = $2
  if (sqlUpper.startsWith('SELECT * FROM USERS WHERE USERNAME =') && sqlUpper.includes('OR EMAIL =')) {
    const [login] = params; // or login can be username or email, handled as params[0], params[1] (both same value in our code)
    const matched = db.users.filter(u => u.username === params[0] || u.email === params[1]);
    return { rows: matched, rowCount: matched.length };
  }

  // 6. SELECT id, username, email, role, created_at FROM users WHERE id = $1
  if (sqlUpper.startsWith('SELECT ID, USERNAME, EMAIL, ROLE, CREATED_AT FROM USERS WHERE ID =')) {
    const id = parseInt(params[0]);
    const matched = db.users.filter(u => u.id === id);
    return { rows: matched, rowCount: matched.length };
  }

  // 6b. SELECT * FROM users WHERE id = $1
  if (sqlUpper.startsWith('SELECT * FROM USERS WHERE ID =')) {
    const id = parseInt(params[0]);
    const matched = db.users.filter(u => u.id === id);
    return { rows: matched, rowCount: matched.length };
  }

  // 7. SELECT * FROM desks ORDER BY id ASC
  if (sqlUpper.startsWith('SELECT * FROM DESKS ORDER BY ID ASC')) {
    const sorted = [...db.desks].sort((a, b) => a.id.localeCompare(b.id));
    return { rows: sorted, rowCount: sorted.length };
  }

  // 8. SELECT * FROM desks WHERE id = $1
  if (sqlUpper.startsWith('SELECT * FROM DESKS WHERE ID =')) {
    const id = params[0];
    const matched = db.desks.filter(d => d.id === id);
    return { rows: matched, rowCount: matched.length };
  }

  // 9. UPDATE desks SET status = $1, current_session_id = $2 WHERE id = $3
  if (sqlUpper.startsWith('UPDATE DESKS SET STATUS =')) {
    const [status, current_session_id, id] = params;
    let updated = false;
    db.desks = db.desks.map(d => {
      if (d.id === id) {
        updated = true;
        return { ...d, status, current_session_id };
      }
      return d;
    });
    if (updated) saveJsonDb(db);
    return { rows: [], rowCount: updated ? 1 : 0 };
  }

  // 10. INSERT INTO sessions
  if (sqlUpper.startsWith('INSERT INTO SESSIONS')) {
    let newSession;
    const newId = db.sessions.length > 0 ? Math.max(...db.sessions.map(s => s.id)) + 1 : 1;
    
    if (params.length === 6) {
      // For seeding historical sessions
      const [user_id, desk_id, status, checked_in_at, checked_out_at, last_ping_at] = params;
      newSession = {
        id: newId,
        user_id: parseInt(user_id),
        desk_id,
        status,
        checked_in_at,
        checked_out_at,
        away_started_at: null,
        last_ping_at,
        verification_pending_at: null,
        created_at: checked_in_at
      };
    } else {
      // For standard live booking (passes 4 params: user_id, desk_id, checked_in_at, last_ping_at)
      const [user_id, desk_id, checked_in_at, last_ping_at] = params;
      newSession = {
        id: newId,
        user_id: parseInt(user_id),
        desk_id,
        status: 'active',
        checked_in_at: checked_in_at || new Date().toISOString(),
        checked_out_at: null,
        away_started_at: null,
        last_ping_at: last_ping_at || new Date().toISOString(),
        verification_pending_at: null,
        created_at: new Date().toISOString()
      };
    }
    
    db.sessions.push(newSession);
    saveJsonDb(db);
    return { rows: [newSession], rowCount: 1, insertId: newId };
  }

  // 11. UPDATE sessions SET status = $1, checked_out_at = $2 WHERE id = $3
  if (sqlUpper.startsWith('UPDATE SESSIONS SET STATUS = $1, CHECKED_OUT_AT = $2 WHERE ID = $3')) {
    const [status, checked_out_at, id] = params;
    const sessionId = parseInt(id);
    let updated = false;
    db.sessions = db.sessions.map(s => {
      if (s.id === sessionId) {
        updated = true;
        return { ...s, status, checked_out_at };
      }
      return s;
    });
    if (updated) saveJsonDb(db);
    return { rows: [], rowCount: updated ? 1 : 0 };
  }

  // 12. UPDATE sessions SET status = $1, away_started_at = $2 WHERE id = $3
  if (sqlUpper.startsWith('UPDATE SESSIONS SET STATUS = $1, AWAY_STARTED_AT = $2 WHERE ID = $3')) {
    const [status, away_started_at, id] = params;
    const sessionId = parseInt(id);
    let updated = false;
    db.sessions = db.sessions.map(s => {
      if (s.id === sessionId) {
        updated = true;
        return { ...s, status, away_started_at };
      }
      return s;
    });
    if (updated) saveJsonDb(db);
    return { rows: [], rowCount: updated ? 1 : 0 };
  }

  // 13. UPDATE sessions SET status = $1, last_ping_at = $2 WHERE id = $3
  if (sqlUpper.startsWith('UPDATE SESSIONS SET STATUS = $1, LAST_PING_AT = $2 WHERE ID = $3')) {
    const [status, last_ping_at, id] = params;
    const sessionId = parseInt(id);
    let updated = false;
    db.sessions = db.sessions.map(s => {
      if (s.id === sessionId) {
        updated = true;
        return { ...s, status, last_ping_at };
      }
      return s;
    });
    if (updated) saveJsonDb(db);
    return { rows: [], rowCount: updated ? 1 : 0 };
  }

  // 14. UPDATE sessions SET verification_pending_at = $1 WHERE id = $2
  if (sqlUpper.startsWith('UPDATE SESSIONS SET VERIFICATION_PENDING_AT = $1 WHERE ID = $2')) {
    const [verification_pending_at, id] = params;
    const sessionId = parseInt(id);
    let updated = false;
    db.sessions = db.sessions.map(s => {
      if (s.id === sessionId) {
        updated = true;
        return { ...s, verification_pending_at };
      }
      return s;
    });
    if (updated) saveJsonDb(db);
    return { rows: [], rowCount: updated ? 1 : 0 };
  }

  // 15. SELECT * FROM sessions WHERE user_id = $1 ORDER BY checked_in_at DESC LIMIT $2
  if (sqlUpper.startsWith('SELECT * FROM SESSIONS WHERE USER_ID =') && sqlUpper.includes('ORDER BY CHECKED_IN_AT DESC LIMIT')) {
    const userId = parseInt(params[0]);
    const limit = parseInt(params[1]) || 10;
    const filtered = db.sessions
      .filter(s => s.user_id === userId)
      .sort((a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at))
      .slice(0, limit);
    return { rows: filtered, rowCount: filtered.length };
  }

  // 16. SELECT * FROM sessions WHERE id = $1
  if (sqlUpper.startsWith('SELECT * FROM SESSIONS WHERE ID =')) {
    const id = parseInt(params[0]);
    const matched = db.sessions.filter(s => s.id === id);
    return { rows: matched, rowCount: matched.length };
  }

  // 17. SELECT s.*, u.username, u.email FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.status = $1
  // Or general sessions list join
  if (sqlUpper.includes('JOIN USERS U ON S.USER_ID = U.ID')) {
    let list = db.sessions;
    if (sqlUpper.includes('WHERE S.STATUS =')) {
      const statusVal = params[0];
      list = list.filter(s => s.status === statusVal);
    }
    const joined = list.map(s => {
      const user = db.users.find(u => u.id === s.user_id) || {};
      return {
        ...s,
        username: user.username || 'unknown',
        email: user.email || 'unknown'
      };
    });
    // Sort latest check-ins first
    joined.sort((a, b) => new Date(b.checked_in_at) - new Date(a.checked_in_at));
    return { rows: joined, rowCount: joined.length };
  }

  // 17b. SELECT s.*, d.name as desk_name FROM sessions s JOIN desks d ON s.desk_id = d.id WHERE s.status = ...
  if (sqlUpper.includes('JOIN DESKS D ON S.DESK_ID = D.ID')) {
    let list = db.sessions;
    if (sqlUpper.includes("WHERE S.STATUS = 'AWAY'")) {
      list = list.filter(s => s.status === 'away');
    } else if (sqlUpper.includes("WHERE S.STATUS = 'ACTIVE' AND S.VERIFICATION_PENDING_AT IS NULL")) {
      list = list.filter(s => s.status === 'active' && s.verification_pending_at === null);
    } else if (sqlUpper.includes("WHERE S.STATUS = 'ACTIVE' AND S.VERIFICATION_PENDING_AT IS NOT NULL")) {
      list = list.filter(s => s.status === 'active' && s.verification_pending_at !== null);
    }
    const joined = list.map(s => {
      const desk = db.desks.find(d => d.id === s.desk_id) || {};
      return {
        ...s,
        desk_name: desk.name || 'unknown'
      };
    });
    return { rows: joined, rowCount: joined.length };
  }

  // 18. INSERT INTO notifications (user_id, message, type) VALUES ($1, $2, $3)
  if (sqlUpper.startsWith('INSERT INTO NOTIFICATIONS')) {
    const [user_id, message, type] = params;
    const newId = db.notifications.length > 0 ? Math.max(...db.notifications.map(n => n.id)) + 1 : 1;
    const newNotification = {
      id: newId,
      user_id: parseInt(user_id),
      message,
      type: type || 'info',
      is_read: false,
      created_at: new Date().toISOString()
    };
    db.notifications.push(newNotification);
    saveJsonDb(db);
    return { rows: [newNotification], rowCount: 1 };
  }

  // 19. SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2
  if (sqlUpper.startsWith('SELECT * FROM NOTIFICATIONS WHERE USER_ID =') && sqlUpper.includes('ORDER BY CREATED_AT DESC')) {
    const userId = parseInt(params[0]);
    const limit = parseInt(params[1]) || 20;
    const filtered = db.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
    return { rows: filtered, rowCount: filtered.length };
  }

  // 20. UPDATE notifications SET is_read = 1 WHERE user_id = $1
  // Wait, in JS is_read is boolean, in SQLite/PG it is boolean or 0/1. Let's make it true
  if (sqlUpper.startsWith('UPDATE NOTIFICATIONS SET IS_READ =')) {
    const userId = parseInt(params[0]);
    let updated = false;
    db.notifications = db.notifications.map(n => {
      if (n.user_id === userId) {
        updated = true;
        return { ...n, is_read: true };
      }
      return n;
    });
    if (updated) saveJsonDb(db);
    return { rows: [], rowCount: updated ? 1 : 0 };
  }

  // 21. General select all sessions (for peak hours analysis, average duration, etc.)
  if (sqlUpper.startsWith('SELECT * FROM SESSIONS')) {
    return { rows: db.sessions, rowCount: db.sessions.length };
  }

  // 22. General SELECT * FROM users (for searching / user lists)
  if (sqlUpper.startsWith('SELECT * FROM USERS')) {
    return { rows: db.users, rowCount: db.users.length };
  }

  // 23. SELECT * FROM users WHERE username = $1
  if (sqlUpper.startsWith('SELECT * FROM USERS WHERE USERNAME =') && !sqlUpper.includes('OR EMAIL')) {
    const username = params[0];
    const matched = db.users.filter(u => u.username === username);
    return { rows: matched, rowCount: matched.length };
  }

  // Query not implemented fallback
  console.warn(`[JSON DB Warning] Unhandled query pattern: "${text}". Returning empty rows.`);
  return { rows: [], rowCount: 0 };
};

// Database Schema Initializer
export const initDb = async () => {
  if (isPostgres) {
    const usersTablePG = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'student',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const desksTablePG = `
      CREATE TABLE IF NOT EXISTS desks (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        zone VARCHAR(100) NOT NULL,
        qr_code TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'available',
        current_session_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const sessionsTablePG = `
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        desk_id VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checked_out_at TIMESTAMP,
        away_started_at TIMESTAMP,
        last_ping_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        verification_pending_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const notificationsTablePG = `
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    try {
      await pgPool.query(usersTablePG);
      await pgPool.query(desksTablePG);
      await pgPool.query(sessionsTablePG);
      await pgPool.query(notificationsTablePG);
      console.log('PostgreSQL database tables successfully initialized.');
    } catch (error) {
      console.error('Error initializing PostgreSQL tables:', error);
    }
  } else {
    // For local JSON DB, initialize by loading database
    const db = loadJsonDb();
    console.log('JSON File-backed database initialized.');
  }
  
  await seedData();
};

// Seed Data Generator
const seedData = async () => {
  try {
    // Check if desks exist
    const desksCheck = await query('SELECT COUNT(*) as count FROM desks');
    const deskCount = parseInt(desksCheck.rows[0].count || desksCheck.rows[0].COUNT || 0);

    if (deskCount === 0) {
      console.log('Seeding initial library desks data...');
      const desks = [
        { id: 'D01', name: 'Desk 1 (Window)', zone: 'Quiet Study' },
        { id: 'D02', name: 'Desk 2 (Window)', zone: 'Quiet Study' },
        { id: 'D03', name: 'Desk 3', zone: 'Quiet Study' },
        { id: 'D04', name: 'Desk 4', zone: 'Quiet Study' },
        { id: 'D05', name: 'Desk 5 (Dual Monitor)', zone: 'Coding Lab' },
        { id: 'D06', name: 'Desk 6 (Dual Monitor)', zone: 'Coding Lab' },
        { id: 'D07', name: 'Desk 7', zone: 'Coding Lab' },
        { id: 'D08', name: 'Desk 8', zone: 'Coding Lab' },
        { id: 'D09', name: 'Desk 9 (Large Desk)', zone: 'Collaborative Space' },
        { id: 'D10', name: 'Desk 10 (Large Desk)', zone: 'Collaborative Space' },
        { id: 'D11', name: 'Desk 11', zone: 'Collaborative Space' },
        { id: 'D12', name: 'Desk 12', zone: 'Collaborative Space' }
      ];

      for (const d of desks) {
        const qrContent = JSON.stringify({ deskId: d.id, action: 'check-in' });
        await query(
          'INSERT INTO desks (id, name, zone, qr_code, status) VALUES ($1, $2, $3, $4, $5)',
          [d.id, d.name, d.zone, qrContent, 'available']
        );
      }
      console.log('Desk seeding completed.');
    }

    // Check if users exist
    const usersCheck = await query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(usersCheck.rows[0].count || usersCheck.rows[0].COUNT || 0);

    if (userCount === 0) {
      console.log('Seeding demo users (Student, Librarian, Admin)...');
      
      const salt = await bcrypt.genSalt(10);
      const studentHash = await bcrypt.hash('student123', salt);
      const librarianHash = await bcrypt.hash('librarian123', salt);
      const adminHash = await bcrypt.hash('admin123', salt);

      await query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['alex_student', 'alex@library.edu', studentHash, 'student']
      );

      await query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['sarah_librarian', 'sarah@library.edu', librarianHash, 'librarian']
      );

      await query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['admin_user', 'admin@library.edu', adminHash, 'admin']
      );
      
      console.log('User seeding completed. Logins:');
      console.log('- Student: alex_student / student123');
      console.log('- Librarian: sarah_librarian / librarian123');
      console.log('- Admin: admin_user / admin123');
    }

    // Check if sessions exist, seed historical sessions if empty
    const sessionsCheck = await query('SELECT COUNT(*) as count FROM sessions');
    const sessionCount = parseInt(sessionsCheck.rows[0].count || sessionsCheck.rows[0].COUNT || 0);
    
    if (sessionCount === 0) {
      console.log('Seeding historical sessions for analytics graphs...');
      const deskIds = ['D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10', 'D11', 'D12'];
      const userIds = [1, 2, 3]; // Mapping alex_student (1), sarah_librarian (2), admin_user (3)
      
      const now = new Date();
      // Generate sessions over the last 7 days
      for (let dayOffset = 7; dayOffset >= 0; dayOffset--) {
        const targetDay = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000);
        
        // On each day, generate between 6 and 10 bookings
        const numBookings = Math.floor(Math.random() * 5) + 6; 
        for (let i = 0; i < numBookings; i++) {
          // Select a desk, with popular desks D01 (window) and D05 (coding monitor) boosted
          let deskId = deskIds[Math.floor(Math.random() * deskIds.length)];
          if (Math.random() < 0.45) {
            const popular = ['D01', 'D02', 'D05', 'D06'];
            deskId = popular[Math.floor(Math.random() * popular.length)];
          }
          
          const userId = userIds[Math.floor(Math.random() * userIds.length)];
          
          // Start hours clustered around peak library times (10am-12pm and 2pm-5pm)
          let startHour = 9;
          const randomFactor = Math.random();
          if (randomFactor < 0.35) {
            startHour = Math.floor(Math.random() * 3) + 10; // 10, 11, 12
          } else if (randomFactor < 0.75) {
            startHour = Math.floor(Math.random() * 4) + 14; // 14, 15, 16, 17
          } else {
            startHour = Math.floor(Math.random() * 5) + 18; // 18, 19, 20, 21, 22
          }
          
          const startMinute = Math.floor(Math.random() * 60);
          
          const checkInTime = new Date(targetDay);
          checkInTime.setHours(startHour, startMinute, 0, 0);
          
          // Bookings typically last between 45 mins and 4 hours
          const durationMins = Math.floor(Math.random() * 195) + 45;
          const checkOutTime = new Date(checkInTime.getTime() + durationMins * 60 * 1000);
          
          // status is mostly completed, occasionally abandoned
          const status = Math.random() < 0.12 ? 'abandoned' : 'completed';
          
          await query(
            'INSERT INTO sessions (user_id, desk_id, status, checked_in_at, checked_out_at, last_ping_at) VALUES ($1, $2, $3, $4, $5, $6)',
            [userId, deskId, status, checkInTime.toISOString(), checkOutTime.toISOString(), checkOutTime.toISOString()]
          );
        }
      }
      console.log('Historical session seeding completed.');
    }

  } catch (error) {
    console.error('Error seeding data:', error);
  }
};
