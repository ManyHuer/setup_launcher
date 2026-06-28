import { createTables, migrateSchema } from './schema.js';
import { initDB, saveDB } from './connection.js';

let dbInstance = null;

export async function getDB() {
  if (!dbInstance) {
    const conn = await initDB();
    createTables(conn.db);
    migrateSchema(conn.db);
    dbInstance = conn;
  }
  return dbInstance;
}

function rowsToArray(db, sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

export function getProfiles(db) {
  return rowsToArray(db, 'SELECT * FROM profiles');
}

export function getProfileById(db, id) {
  const results = rowsToArray(db, 'SELECT * FROM profiles WHERE id = ?', [id]);
  return results[0] || null;
}

export function createProfile(db, { name, icon, description }) {
  db.run('INSERT INTO profiles (name, icon, description) VALUES (?, ?, ?)', [
    name, icon || '📁', description || '',
  ]);
  return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
}

export function updateProfile(db, id, { name, icon, description }) {
  db.run('UPDATE profiles SET name = ?, icon = ?, description = ? WHERE id = ?', [
    name, icon, description, id,
  ]);
}

export function deleteProfile(db, id) {
  db.run('DELETE FROM applications WHERE profile_id = ?', [id]);
  db.run('DELETE FROM profiles WHERE id = ?', [id]);
}

export function getApplicationsByProfile(db, profileId) {
  return rowsToArray(db, 'SELECT * FROM applications WHERE profile_id = ?', [profileId]);
}

export function createApplication(db, { profile_id, name, path, type, tab_group }) {
  db.run('INSERT INTO applications (profile_id, name, path, type, tab_group) VALUES (?, ?, ?, ?, ?)', [
    profile_id, name, path || '', type || 'app', tab_group || null,
  ]);
  return db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
}

export function updateApplication(db, id, { name, path, type, tab_group }) {
  db.run('UPDATE applications SET name = ?, path = ?, type = ?, tab_group = ? WHERE id = ?', [
    name, path, type || 'app', tab_group || null, id,
  ]);
}

export function deleteApplication(db, id) {
  db.run('DELETE FROM applications WHERE id = ?', [id]);
}

export function saveChanges(db, dbPath) {
  saveDB(db, dbPath);
}
