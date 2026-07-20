import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'submissions.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, '[]');
}

export function loadSubmissions() {
  ensureFile();
  return JSON.parse(fs.readFileSync(FILE, 'utf-8'));
}

export function saveSubmissions(list) {
  ensureFile();
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2));
}

export function addSubmission(sub) {
  const list = loadSubmissions();
  const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry = { id, status: 'pending', submittedAt: new Date().toISOString(), ...sub };
  list.push(entry);
  saveSubmissions(list);
  return entry;
}

export function removeSubmission(id) {
  const list = loadSubmissions().filter((s) => s.id !== id);
  saveSubmissions(list);
  return list;
}
