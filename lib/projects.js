import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');

const DEFAULT_PROJECTS = [
  { id: 'client-a', name: 'Client A', color: '#378ADD' },
  { id: 'client-b', name: 'Client B', color: '#D85A30' },
  { id: 'perso', name: 'Perso', color: '#1D9E75' },
  { id: 'admin', name: 'Admin', color: '#BA7517' },
];

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(DEFAULT_PROJECTS, null, 2));
  }
}

export function loadProjects() {
  ensureFile();
  return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'));
}

export function saveProjects(list) {
  ensureFile();
  fs.writeFileSync(PROJECTS_FILE, JSON.stringify(list, null, 2));
}

export function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
