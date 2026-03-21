import express from 'express';
import cors from 'cors';
import initSqlJs from 'sql.js';
import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { classifySeverity } from './classify.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const dbPath = path.join(__dirname, 'hazard.db');

const JWT_SECRET = 'hazard-reporter-secret-key-2024';
const SALT_LENGTH = 16;
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';
const TOKEN_EXPIRY_HOURS = 24;

function generateId() {
  return 'HZ-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

function generateTrackingCode() {
  return 'TRK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// --- Password hashing ---
function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  const verify = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
  return hash === verify;
}

// --- Token generation / verification ---
function createToken(payload) {
  const data = { ...payload, exp: Date.now() + TOKEN_EXPIRY_HOURS * 3600000 };
  const payloadB64 = Buffer.from(JSON.stringify(data)).toString('base64');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(payloadB64).digest('base64');
  return `${payloadB64}.${signature}`;
}

function verifyToken(token) {
  try {
    const [payloadB64, signature] = token.split('.');
    if (!payloadB64 || !signature) return null;
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(payloadB64).digest('base64');
    if (signature !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// --- Auth middleware ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Authorization header required' });
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: 'Invalid or expired token' });
  req.user = payload;
  next();
}

// --- Initialize sql.js and database ---
const SQL = await initSqlJs();
let db;

if (fs.existsSync(dbPath)) {
  const buffer = fs.readFileSync(dbPath);
  db = new SQL.Database(buffer);
} else {
  db = new SQL.Database();
}

function saveDb() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// Helper: run query, return all rows as objects
function allRows(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: get one row
function getRow(sql, params = []) {
  const rows = allRows(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: run statement (INSERT/UPDATE/DELETE)
function run(sql, params = []) {
  db.run(sql, params);
}

// --- Schema ---
db.run(`
  CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    location TEXT,
    location_detail TEXT,
    reported_by_name TEXT,
    reported_by_email TEXT,
    reported_by_phone TEXT,
    photo_url TEXT,
    severity TEXT CHECK(severity IN ('critical','high','medium','low')),
    status TEXT DEFAULT 'reported' CHECK(status IN ('reported','acknowledged','dispatched','in_progress','resolved','closed')),
    assigned_team TEXT,
    assigned_to TEXT,
    created_at TEXT,
    updated_at TEXT,
    resolved_at TEXT,
    tracking_code TEXT UNIQUE,
    latitude REAL,
    longitude REAL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS status_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id TEXT NOT NULL,
    old_status TEXT,
    new_status TEXT,
    note TEXT,
    updated_by TEXT,
    created_at TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin','reporter')) DEFAULT 'reporter',
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TEXT
  )
`);

// Add latitude/longitude columns to existing incidents table if missing
try { db.run('ALTER TABLE incidents ADD COLUMN latitude REAL'); } catch (e) { /* column already exists */ }
try { db.run('ALTER TABLE incidents ADD COLUMN longitude REAL'); } catch (e) { /* column already exists */ }

// --- Seed data ---
function seedDatabase() {
  const row = getRow('SELECT COUNT(*) AS c FROM incidents');
  if (row.c > 0) return;

  const now = new Date();
  const hoursAgo = (h) => new Date(now.getTime() - h * 3600000).toISOString();
  const daysAgo = (d) => hoursAgo(d * 24);

  const seeds = [
    { title: 'Sparking electrical panel in Building C basement', description: 'The main electrical panel in Building C basement is sparking intermittently. Strong burning smell detected. Area has been cordoned off by security.', category: 'electrical', location: 'Building C', location_detail: 'Basement, Panel Room B-04', reported_by_name: 'James Morton', reported_by_email: 'jmorton@facility.edu', reported_by_phone: '555-0101', severity: 'critical', status: 'dispatched', assigned_team: 'electrical_maintenance', assigned_to: 'Mike Torres', created_at: hoursAgo(2), updated_at: hoursAgo(1) },
    { title: 'Ceiling collapse risk in Library Wing D', description: 'Large structural crack running across the ceiling of the reading room. Pieces of plaster have already fallen. Multiple witnesses report the crack has grown over the past week.', category: 'structural', location: 'Main Library', location_detail: 'Wing D, 2nd Floor Reading Room', reported_by_name: 'Sarah Chen', reported_by_email: 'schen@facility.edu', reported_by_phone: '555-0102', severity: 'critical', status: 'in_progress', assigned_team: 'structural_engineering', assigned_to: 'David Park', created_at: daysAgo(1), updated_at: hoursAgo(5) },
    { title: 'Fire exit blocked by construction materials', description: 'The east fire exit on the 3rd floor of Admin Building is completely blocked by stacked drywall and construction equipment. This is a blocked exit and serious fire code violation.', category: 'fire_safety', location: 'Admin Building', location_detail: '3rd Floor, East Stairwell', reported_by_name: 'Linda Reyes', reported_by_email: 'lreyes@facility.edu', reported_by_phone: '555-0103', severity: 'high', status: 'acknowledged', assigned_team: 'fire_safety_team', assigned_to: null, created_at: hoursAgo(6), updated_at: hoursAgo(4) },
    { title: 'Chemical storage cabinet leaking in Lab 201', description: 'Unknown chemical leak from the flammable storage cabinet. Small puddle on the floor with strong odor. Lab has been evacuated as a precaution.', category: 'chemical', location: 'Science Building', location_detail: 'Lab 201, North Wall', reported_by_name: 'Dr. Robert Kim', reported_by_email: 'rkim@facility.edu', reported_by_phone: '555-0104', severity: 'critical', status: 'in_progress', assigned_team: 'hazmat_response', assigned_to: 'Angela Ruiz', created_at: hoursAgo(3), updated_at: hoursAgo(1) },
    { title: 'Wheelchair ramp broken at Student Center entrance', description: 'The concrete wheelchair ramp at the main entrance has a large broken section creating a dangerous drop-off. Currently unusable for wheelchair users.', category: 'accessibility', location: 'Student Center', location_detail: 'Main Entrance, South Side', reported_by_name: 'Maria Gonzalez', reported_by_email: 'mgonzalez@facility.edu', reported_by_phone: '555-0105', severity: 'high', status: 'dispatched', assigned_team: 'accessibility_services', assigned_to: 'Tom Bradley', created_at: daysAgo(2), updated_at: daysAgo(1) },
    { title: 'Flooding in Residence Hall B ground floor', description: 'Major flooding in the ground floor corridor. Water is about 2 inches deep from a burst pipe in the utility closet. Several rooms affected.', category: 'water_damage', location: 'Residence Hall B', location_detail: 'Ground Floor Corridor', reported_by_name: 'Kevin White', reported_by_email: 'kwhite@facility.edu', reported_by_phone: '555-0106', severity: 'high', status: 'in_progress', assigned_team: 'plumbing_maintenance', assigned_to: 'Carlos Mendez', created_at: hoursAgo(8), updated_at: hoursAgo(3) },
    { title: 'Flickering lights in Parking Garage Level 2', description: 'Multiple overhead lights flickering on and off on Level 2. Creates poor visibility especially in the evening.', category: 'lighting', location: 'Main Parking Garage', location_detail: 'Level 2, Section C-D', reported_by_name: 'Nancy Brooks', reported_by_email: 'nbrooks@facility.edu', reported_by_phone: '555-0107', severity: 'medium', status: 'reported', assigned_team: 'facilities_lighting', assigned_to: null, created_at: hoursAgo(12), updated_at: hoursAgo(12) },
    { title: 'Mold growth in gymnasium locker room', description: 'Visible black mold on the ceiling and walls of the men\'s locker room. Strong musty odor. Area around showers is worst affected.', category: 'environmental', location: 'Athletics Center', location_detail: 'Men\'s Locker Room', reported_by_name: 'Coach Dan Harris', reported_by_email: 'dharris@facility.edu', reported_by_phone: '555-0108', severity: 'high', status: 'acknowledged', assigned_team: 'environmental_health', assigned_to: null, created_at: daysAgo(3), updated_at: daysAgo(2) },
    { title: 'Broken security camera at north parking lot', description: 'Security camera at the north entrance has been vandalized and is no longer functioning.', category: 'security', location: 'North Parking Lot', location_detail: 'Entrance Gate Post #3', reported_by_name: 'Officer Pat Riley', reported_by_email: 'priley@facility.edu', reported_by_phone: '555-0109', severity: 'medium', status: 'dispatched', assigned_team: 'campus_security', assigned_to: 'Jason Cole', created_at: daysAgo(4), updated_at: daysAgo(3) },
    { title: 'Loose railing on Engineering Building stairway', description: 'The handrail on the main stairway between floors 2 and 3 is very loose and wobbles when grasped.', category: 'structural', location: 'Engineering Building', location_detail: 'Main Stairway, Floors 2-3', reported_by_name: 'Prof. Lisa Chang', reported_by_email: 'lchang@facility.edu', reported_by_phone: '555-0110', severity: 'medium', status: 'reported', assigned_team: 'structural_engineering', assigned_to: null, created_at: daysAgo(1), updated_at: daysAgo(1) },
    { title: 'Water leak from ceiling in Cafeteria', description: 'Steady dripping leak from the ceiling near the serving area. Bucket placed to catch water.', category: 'water_damage', location: 'Main Cafeteria', location_detail: 'Serving Area, near Station 3', reported_by_name: 'Greg Palmer', reported_by_email: 'gpalmer@facility.edu', reported_by_phone: '555-0111', severity: 'medium', status: 'resolved', assigned_team: 'plumbing_maintenance', assigned_to: 'Carlos Mendez', created_at: daysAgo(7), updated_at: daysAgo(2), resolved_at: daysAgo(2) },
    { title: 'Cracked tiles in Admin Building lobby', description: 'Several floor tiles in the main lobby are cracked and uneven, creating a trip hazard.', category: 'other', location: 'Admin Building', location_detail: 'Main Lobby', reported_by_name: 'Rebecca Stone', reported_by_email: 'rstone@facility.edu', reported_by_phone: '555-0112', severity: 'low', status: 'closed', assigned_team: 'general_maintenance', assigned_to: 'Bill Foster', created_at: daysAgo(14), updated_at: daysAgo(5), resolved_at: daysAgo(6) },
    { title: 'Smoke detector beeping in Dorm Room 415', description: 'Smoke detector has been beeping intermittently for two days. Likely low battery but needs inspection.', category: 'fire_safety', location: 'Residence Hall A', location_detail: 'Room 415, 4th Floor', reported_by_name: 'Tyler James', reported_by_email: 'tjames@facility.edu', reported_by_phone: '555-0113', severity: 'medium', status: 'resolved', assigned_team: 'fire_safety_team', assigned_to: 'Sam Wright', created_at: daysAgo(5), updated_at: daysAgo(3), resolved_at: daysAgo(3) },
    { title: 'Faulty outlet sparking in Office 302', description: 'Wall outlet produces visible sparks when anything is plugged in. Staff have stopped using it but it poses a fire risk.', category: 'electrical', location: 'Admin Building', location_detail: 'Office 302, West Wall', reported_by_name: 'Diana Marsh', reported_by_email: 'dmarsh@facility.edu', reported_by_phone: '555-0114', severity: 'high', status: 'resolved', assigned_team: 'electrical_maintenance', assigned_to: 'Mike Torres', created_at: daysAgo(6), updated_at: daysAgo(1), resolved_at: daysAgo(1) },
  ];

  for (const seed of seeds) {
    const id = generateId();
    const trackingCode = generateTrackingCode();
    run(
      `INSERT INTO incidents (id, title, description, category, location, location_detail,
        reported_by_name, reported_by_email, reported_by_phone, photo_url, severity, status,
        assigned_team, assigned_to, created_at, updated_at, resolved_at, tracking_code, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, seed.title, seed.description, seed.category, seed.location, seed.location_detail,
       seed.reported_by_name, seed.reported_by_email, seed.reported_by_phone, null,
       seed.severity, seed.status, seed.assigned_team, seed.assigned_to || null,
       seed.created_at, seed.updated_at, seed.resolved_at || null, trackingCode, null, null]
    );

    run(
      `INSERT INTO status_updates (incident_id, old_status, new_status, note, updated_by, created_at)
      VALUES (?, NULL, 'reported', 'Incident reported and auto-classified.', 'system', ?)`,
      [id, seed.created_at]
    );

    const statusFlow = ['reported', 'acknowledged', 'dispatched', 'in_progress', 'resolved', 'closed'];
    const targetIdx = statusFlow.indexOf(seed.status);
    for (let i = 1; i <= targetIdx; i++) {
      run(
        `INSERT INTO status_updates (incident_id, old_status, new_status, note, updated_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [id, statusFlow[i - 1], statusFlow[i], `Status updated to ${statusFlow[i]}.`, seed.assigned_to || 'dispatch', seed.updated_at]
      );
    }
  }

  saveDb();
  console.log(`Seeded ${seeds.length} sample incidents.`);
}

// --- Seed default admin user ---
function seedAdminUser() {
  const existing = getRow('SELECT COUNT(*) AS c FROM users WHERE username = ?', ['admin']);
  if (existing.c > 0) return;

  const id = 'USR-' + crypto.randomBytes(3).toString('hex').toUpperCase();
  const passwordHash = hashPassword('admin123');
  const now = new Date().toISOString();

  run(
    `INSERT INTO users (id, username, email, password_hash, role, full_name, phone, avatar_url, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, 'admin', 'admin@hazardreporter.com', passwordHash, 'admin', 'System Administrator', null, null, now]
  );

  saveDb();
  console.log('Seeded default admin user.');
}

seedDatabase();
seedAdminUser();

// --- Express ---
const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

const distDir = path.join(ROOT_DIR, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// --- Multer ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|webp|bmp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// --- API Routes ---

// === Auth Routes ===

app.post('/api/auth/register', (req, res) => {
  try {
    const { username, email, password, full_name, phone, role } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    const existingUser = getRow('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const id = 'USR-' + crypto.randomBytes(3).toString('hex').toUpperCase();
    const passwordHash = hashPassword(password);
    const now = new Date().toISOString();
    const userRole = (role === 'admin' || role === 'reporter') ? role : 'reporter';

    run(
      `INSERT INTO users (id, username, email, password_hash, role, full_name, phone, avatar_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, username, email, passwordHash, userRole, full_name || null, phone || null, null, now]
    );
    saveDb();

    const token = createToken({ id, username, role: userRole });

    res.status(201).json({
      token,
      user: { id, username, email, role: userRole, full_name: full_name || null, phone: phone || null, avatar_url: null, created_at: now }
    });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = getRow('SELECT * FROM users WHERE username = ?', [username]);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = createToken({ id: user.id, username: user.username, role: user.role });

    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role, full_name: user.full_name, phone: user.phone, avatar_url: user.avatar_url, created_at: user.created_at }
    });
  } catch (err) {
    console.error('Error logging in:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const user = getRow('SELECT id, username, email, role, full_name, phone, avatar_url, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Error getting profile:', err);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

app.patch('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const { full_name, email, phone } = req.body;
    const updates = [];
    const params = [];

    if (full_name !== undefined) { updates.push('full_name = ?'); params.push(full_name); }
    if (email !== undefined) {
      const existing = getRow('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
      if (existing) return res.status(409).json({ error: 'Email already in use' });
      updates.push('email = ?');
      params.push(email);
    }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }

    if (updates.length === 0) {
      const user = getRow('SELECT id, username, email, role, full_name, phone, avatar_url, created_at FROM users WHERE id = ?', [req.user.id]);
      return res.json(user);
    }

    params.push(req.user.id);
    run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
    saveDb();

    const user = getRow('SELECT id, username, email, role, full_name, phone, avatar_url, created_at FROM users WHERE id = ?', [req.user.id]);
    res.json(user);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// === AI Analysis Routes ===

app.get('/api/ai/analyze', (req, res) => {
  try {
    const incidents = allRows('SELECT * FROM incidents');
    if (incidents.length === 0) {
      return res.json({ risk_score: 0, trend_analysis: [], hotspot_locations: [], recommendations: [] });
    }

    const total = incidents.length;
    const critical = incidents.filter(i => i.severity === 'critical').length;
    const high = incidents.filter(i => i.severity === 'high').length;
    const medium = incidents.filter(i => i.severity === 'medium').length;
    const low = incidents.filter(i => i.severity === 'low').length;
    const active = incidents.filter(i => !['resolved', 'closed'].includes(i.status)).length;

    // Risk score: weighted severity + active ratio
    const risk_score = Math.min(100, Math.round(
      ((critical * 40 + high * 25 + medium * 10 + low * 2) / total) * (active / Math.max(total, 1)) * 100 + (critical > 0 ? 20 : 0)
    ));

    // Trend analysis: group by category
    const categoryMap = {};
    for (const inc of incidents) {
      const cat = inc.category || 'other';
      if (!categoryMap[cat]) categoryMap[cat] = { category: cat, count: 0, critical: 0, high: 0, resolved: 0 };
      categoryMap[cat].count++;
      if (inc.severity === 'critical') categoryMap[cat].critical++;
      if (inc.severity === 'high') categoryMap[cat].high++;
      if (inc.status === 'resolved' || inc.status === 'closed') categoryMap[cat].resolved++;
    }
    const trend_analysis = Object.values(categoryMap).map(c => ({
      category: c.category,
      count: c.count,
      severity_breakdown: { critical: c.critical, high: c.high },
      resolution_rate: c.count > 0 ? Math.round((c.resolved / c.count) * 100) : 0,
      trend: c.critical > 0 ? 'increasing' : c.resolved >= c.count * 0.5 ? 'decreasing' : 'stable'
    })).sort((a, b) => b.count - a.count);

    // Hotspot locations
    const locationMap = {};
    for (const inc of incidents) {
      const loc = inc.location || 'Unknown';
      if (!locationMap[loc]) locationMap[loc] = { location: loc, incident_count: 0, severities: [] };
      locationMap[loc].incident_count++;
      locationMap[loc].severities.push(inc.severity);
    }
    const hotspot_locations = Object.values(locationMap)
      .map(l => ({
        location: l.location,
        incident_count: l.incident_count,
        highest_severity: ['critical', 'high', 'medium', 'low'].find(s => l.severities.includes(s)) || 'low',
        risk_level: l.incident_count >= 3 ? 'high' : l.incident_count >= 2 ? 'medium' : 'low'
      }))
      .sort((a, b) => b.incident_count - a.incident_count)
      .slice(0, 10);

    // Recommendations
    const recommendations = [];
    if (critical > 0) {
      recommendations.push({ priority: 'critical', message: `${critical} critical incident(s) require immediate attention`, action: 'Deploy emergency response teams to critical incidents' });
    }
    if (high > 2) {
      recommendations.push({ priority: 'high', message: `${high} high-severity incidents detected`, action: 'Increase staffing for high-priority incident response' });
    }
    const unresolvedOld = incidents.filter(i => !['resolved', 'closed'].includes(i.status) && new Date(i.created_at) < new Date(Date.now() - 7 * 86400000));
    if (unresolvedOld.length > 0) {
      recommendations.push({ priority: 'medium', message: `${unresolvedOld.length} incident(s) unresolved for over 7 days`, action: 'Review and escalate aging incidents' });
    }
    const topCategory = trend_analysis[0];
    if (topCategory && topCategory.count >= 3) {
      recommendations.push({ priority: 'medium', message: `"${topCategory.category}" is the most frequent incident category (${topCategory.count} incidents)`, action: `Conduct targeted inspection and preventive maintenance for ${topCategory.category}` });
    }
    if (active / total > 0.6) {
      recommendations.push({ priority: 'high', message: `${Math.round((active / total) * 100)}% of incidents are still active`, action: 'Allocate additional resources to reduce incident backlog' });
    }

    res.json({
      risk_score,
      total_incidents: total,
      active_incidents: active,
      trend_analysis,
      hotspot_locations,
      recommendations,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error generating AI analysis:', err);
    res.status(500).json({ error: 'Failed to generate analysis' });
  }
});

app.get('/api/ai/analyze/:id', (req, res) => {
  try {
    const incident = getRow('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    // Risk assessment
    const severityScores = { critical: 90, high: 70, medium: 40, low: 15 };
    const statusModifiers = { reported: 1.2, acknowledged: 1.1, dispatched: 1.0, in_progress: 0.8, resolved: 0.3, closed: 0.1 };
    const baseScore = severityScores[incident.severity] || 40;
    const modifier = statusModifiers[incident.status] || 1.0;
    const ageHours = (Date.now() - new Date(incident.created_at).getTime()) / 3600000;
    const ageFactor = Math.min(1.3, 1 + ageHours / (7 * 24));
    const risk_assessment = {
      risk_score: Math.min(100, Math.round(baseScore * modifier * ageFactor)),
      severity: incident.severity,
      status: incident.status,
      age_hours: Math.round(ageHours),
      factors: []
    };
    if (incident.severity === 'critical') risk_assessment.factors.push('Critical severity level');
    if (ageHours > 48 && !['resolved', 'closed'].includes(incident.status)) risk_assessment.factors.push('Unresolved for over 48 hours');
    if (!incident.assigned_to) risk_assessment.factors.push('No individual assigned');
    if (['reported'].includes(incident.status)) risk_assessment.factors.push('Not yet acknowledged');

    // Similar incidents
    const similar = allRows(
      'SELECT id, title, category, severity, status, location FROM incidents WHERE category = ? AND id != ? ORDER BY created_at DESC LIMIT 5',
      [incident.category, incident.id]
    );

    // Recommended actions
    const recommended_actions = [];
    if (incident.status === 'reported') {
      recommended_actions.push({ action: 'Acknowledge incident', priority: 'high', reason: 'Incident has not been acknowledged yet' });
    }
    if (!incident.assigned_to) {
      recommended_actions.push({ action: 'Assign to a responder', priority: 'high', reason: 'No individual is assigned to handle this incident' });
    }
    if (incident.severity === 'critical' && incident.status !== 'in_progress' && incident.status !== 'resolved' && incident.status !== 'closed') {
      recommended_actions.push({ action: 'Escalate to emergency response', priority: 'critical', reason: 'Critical incidents require immediate hands-on response' });
    }
    if (ageHours > 24 && !['resolved', 'closed'].includes(incident.status)) {
      recommended_actions.push({ action: 'Escalate to management', priority: 'medium', reason: 'Incident has been open for over 24 hours' });
    }
    recommended_actions.push({ action: 'Document findings and update status', priority: 'low', reason: 'Keep stakeholders informed of progress' });

    // Estimated resolution time
    const resolvedSimilar = allRows(
      "SELECT created_at, resolved_at FROM incidents WHERE category = ? AND resolved_at IS NOT NULL",
      [incident.category]
    );
    let estimated_resolution_hours = null;
    if (resolvedSimilar.length > 0) {
      const totalMs = resolvedSimilar.reduce((sum, r) => sum + (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()), 0);
      estimated_resolution_hours = Math.round((totalMs / resolvedSimilar.length) / 3600000 * 10) / 10;
    } else {
      const defaultHours = { critical: 4, high: 12, medium: 48, low: 168 };
      estimated_resolution_hours = defaultHours[incident.severity] || 48;
    }

    res.json({
      incident_id: incident.id,
      risk_assessment,
      similar_incidents: similar,
      recommended_actions,
      estimated_resolution_hours,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error generating incident analysis:', err);
    res.status(500).json({ error: 'Failed to generate incident analysis' });
  }
});

// === Existing Routes ===

app.post('/api/uploads', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.post('/api/reports', upload.single('photo'), (req, res) => {
  try {
    const { title, description, category, location, location_detail,
      reported_by_name, reported_by_email, reported_by_phone, urgency, latitude, longitude } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const classification = classifySeverity(category || 'other', description || '', urgency || '');
    const id = generateId();
    const trackingCode = generateTrackingCode();
    const now = new Date().toISOString();
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const lat = latitude !== undefined && latitude !== null && latitude !== '' ? parseFloat(latitude) : null;
    const lng = longitude !== undefined && longitude !== null && longitude !== '' ? parseFloat(longitude) : null;

    run(
      `INSERT INTO incidents (id, title, description, category, location, location_detail,
        reported_by_name, reported_by_email, reported_by_phone, photo_url, severity, status,
        assigned_team, assigned_to, created_at, updated_at, resolved_at, tracking_code, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'reported', ?, NULL, ?, ?, NULL, ?, ?, ?)`,
      [id, title, description || null, category || 'other', location || null, location_detail || null,
       reported_by_name || null, reported_by_email || null, reported_by_phone || null, photoUrl,
       classification.severity, classification.assigned_team, now, now, trackingCode, lat, lng]
    );

    run(
      `INSERT INTO status_updates (incident_id, old_status, new_status, note, updated_by, created_at)
      VALUES (?, NULL, 'reported', ?, 'system', ?)`,
      [id, classification.reasoning, now]
    );

    saveDb();

    const incident = getRow('SELECT * FROM incidents WHERE id = ?', [id]);
    res.status(201).json({ ...incident, classification });
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

app.get('/api/incidents', (req, res) => {
  try {
    const { status, severity, category, assigned_team, search, sort, order } = req.query;
    let sql = 'SELECT * FROM incidents';
    const conditions = [];
    const params = [];

    if (status) { conditions.push('status = ?'); params.push(status); }
    if (severity) { conditions.push('severity = ?'); params.push(severity); }
    if (category) { conditions.push('category = ?'); params.push(category); }
    if (assigned_team) { conditions.push('assigned_team = ?'); params.push(assigned_team); }
    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (conditions.length > 0) sql += ` WHERE ${conditions.join(' AND ')}`;

    const allowedSorts = ['created_at', 'severity', 'status', 'updated_at', 'title'];
    const sortCol = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    if (sortCol === 'severity') {
      sql += ` ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 WHEN 'low' THEN 4 END ${sortOrder}`;
    } else if (sortCol === 'status') {
      sql += ` ORDER BY CASE status WHEN 'reported' THEN 1 WHEN 'acknowledged' THEN 2 WHEN 'dispatched' THEN 3 WHEN 'in_progress' THEN 4 WHEN 'resolved' THEN 5 WHEN 'closed' THEN 6 END ${sortOrder}`;
    } else {
      sql += ` ORDER BY ${sortCol} ${sortOrder}`;
    }

    res.json(allRows(sql, params));
  } catch (err) {
    console.error('Error listing incidents:', err);
    res.status(500).json({ error: 'Failed to list incidents' });
  }
});

app.get('/api/incidents/stats', (req, res) => {
  try {
    const total = getRow('SELECT COUNT(*) AS c FROM incidents').c;

    const byStatusRows = allRows('SELECT status, COUNT(*) AS c FROM incidents GROUP BY status');
    const by_status = {};
    for (const r of byStatusRows) by_status[r.status] = r.c;

    const bySeverityRows = allRows('SELECT severity, COUNT(*) AS c FROM incidents GROUP BY severity');
    const by_severity = {};
    for (const r of bySeverityRows) by_severity[r.severity] = r.c;

    const byCategoryRows = allRows('SELECT category, COUNT(*) AS c FROM incidents GROUP BY category');
    const by_category = {};
    for (const r of byCategoryRows) by_category[r.category] = r.c;

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 3600000).toISOString();
    const recent_24h = getRow('SELECT COUNT(*) AS c FROM incidents WHERE created_at >= ?', [twentyFourHoursAgo]).c;

    const resolvedRows = allRows("SELECT created_at, resolved_at FROM incidents WHERE resolved_at IS NOT NULL");
    let avg_resolution_time_hours = null;
    if (resolvedRows.length > 0) {
      const totalMs = resolvedRows.reduce((sum, r) => {
        return sum + (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime());
      }, 0);
      avg_resolution_time_hours = Math.round((totalMs / resolvedRows.length) / 3600000 * 10) / 10;
    }

    res.json({ total, by_status, by_severity, by_category, recent_24h, avg_resolution_time_hours });
  } catch (err) {
    console.error('Error getting stats:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

app.get('/api/incidents/:id', (req, res) => {
  try {
    const incident = getRow('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const status_updates = allRows(
      'SELECT * FROM status_updates WHERE incident_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({ ...incident, status_updates });
  } catch (err) {
    console.error('Error getting incident:', err);
    res.status(500).json({ error: 'Failed to get incident' });
  }
});

app.patch('/api/incidents/:id', (req, res) => {
  try {
    const incident = getRow('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const { status, assigned_team, assigned_to, severity, note, updated_by } = req.body;
    const now = new Date().toISOString();
    const updates = [];
    const params = [];

    if (status && status !== incident.status) {
      updates.push('status = ?');
      params.push(status);

      if ((status === 'resolved' || status === 'closed') && !incident.resolved_at) {
        updates.push('resolved_at = ?');
        params.push(now);
      }

      run(
        `INSERT INTO status_updates (incident_id, old_status, new_status, note, updated_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [req.params.id, incident.status, status, note || null, updated_by || 'dispatch', now]
      );
    }

    if (assigned_team !== undefined) { updates.push('assigned_team = ?'); params.push(assigned_team); }
    if (assigned_to !== undefined) { updates.push('assigned_to = ?'); params.push(assigned_to); }
    if (severity !== undefined) { updates.push('severity = ?'); params.push(severity); }

    if (updates.length === 0) {
      return res.json(incident);
    }

    updates.push('updated_at = ?');
    params.push(now);
    params.push(req.params.id);

    run(`UPDATE incidents SET ${updates.join(', ')} WHERE id = ?`, params);
    saveDb();

    const updated = getRow('SELECT * FROM incidents WHERE id = ?', [req.params.id]);
    const status_updates = allRows(
      'SELECT * FROM status_updates WHERE incident_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({ ...updated, status_updates });
  } catch (err) {
    console.error('Error updating incident:', err);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

app.get('/api/track/:code', (req, res) => {
  try {
    const incident = getRow(
      'SELECT id, title, category, severity, status, location, location_detail, assigned_team, created_at, updated_at, resolved_at, tracking_code, latitude, longitude FROM incidents WHERE tracking_code = ?',
      [req.params.code]
    );
    if (!incident) return res.status(404).json({ error: 'Tracking code not found' });

    const status_updates = allRows(
      'SELECT new_status, note, created_at FROM status_updates WHERE incident_id = ? ORDER BY created_at ASC',
      [incident.id]
    );

    res.json({ ...incident, status_updates });
  } catch (err) {
    console.error('Error tracking:', err);
    res.status(500).json({ error: 'Failed to track incident' });
  }
});

// SPA fallback
app.get('*', (req, res) => {
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Hazard Reporter server running on http://localhost:${PORT}`);
});
