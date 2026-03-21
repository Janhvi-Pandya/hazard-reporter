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

function generateId() {
  return 'HZ-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

function generateTrackingCode() {
  return 'TRK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
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
    tracking_code TEXT UNIQUE
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
        assigned_team, assigned_to, created_at, updated_at, resolved_at, tracking_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, seed.title, seed.description, seed.category, seed.location, seed.location_detail,
       seed.reported_by_name, seed.reported_by_email, seed.reported_by_phone, null,
       seed.severity, seed.status, seed.assigned_team, seed.assigned_to || null,
       seed.created_at, seed.updated_at, seed.resolved_at || null, trackingCode]
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

seedDatabase();

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

app.post('/api/uploads', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.post('/api/reports', upload.single('photo'), (req, res) => {
  try {
    const { title, description, category, location, location_detail,
      reported_by_name, reported_by_email, reported_by_phone, urgency } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });

    const classification = classifySeverity(category || 'other', description || '', urgency || '');
    const id = generateId();
    const trackingCode = generateTrackingCode();
    const now = new Date().toISOString();
    const photoUrl = req.file ? `/uploads/${req.file.filename}` : null;

    run(
      `INSERT INTO incidents (id, title, description, category, location, location_detail,
        reported_by_name, reported_by_email, reported_by_phone, photo_url, severity, status,
        assigned_team, assigned_to, created_at, updated_at, resolved_at, tracking_code)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'reported', ?, NULL, ?, ?, NULL, ?)`,
      [id, title, description || null, category || 'other', location || null, location_detail || null,
       reported_by_name || null, reported_by_email || null, reported_by_phone || null, photoUrl,
       classification.severity, classification.assigned_team, now, now, trackingCode]
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
      'SELECT id, title, category, severity, status, location, location_detail, assigned_team, created_at, updated_at, resolved_at, tracking_code FROM incidents WHERE tracking_code = ?',
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
