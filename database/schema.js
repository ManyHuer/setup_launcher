export function createTables(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      path TEXT,
      type TEXT DEFAULT 'app',
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
  `);
}

export function migrateSchema(db) {
  const cols = db.exec('PRAGMA table_info(applications)');
  const colNames = cols[0]?.values.map((c) => c[1]) || [];

  if (colNames.includes('executable_path') && !colNames.includes('path')) {
    db.run('ALTER TABLE applications RENAME TO applications_old');
    db.run(`
      CREATE TABLE applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        path TEXT,
        type TEXT DEFAULT 'app',
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
      )
    `);
    db.run('INSERT INTO applications (id, profile_id, name, path, type) SELECT id, profile_id, name, executable_path, \'app\' FROM applications_old');
    db.run('DROP TABLE applications_old');
  }

  if (!colNames.includes('type')) {
    try {
      db.run('ALTER TABLE applications ADD COLUMN type TEXT DEFAULT \'app\'');
    } catch {}
  }

  if (!colNames.includes('tab_group')) {
    try {
      db.run('ALTER TABLE applications ADD COLUMN tab_group TEXT');
    } catch {}
  }
}
