import { readData, writeData } from './datastore.js';

const DEFAULT_PROJECTS = [
  { id: 'client-a', name: 'Client A', color: '#378ADD' },
  { id: 'client-b', name: 'Client B', color: '#D85A30' },
  { id: 'perso', name: 'Perso', color: '#1D9E75' },
  { id: 'admin', name: 'Admin', color: '#BA7517' },
];

export async function loadProjects() {
  return readData('projects.json', DEFAULT_PROJECTS);
}

export async function saveProjects(list) {
  await writeData('projects.json', list);
}

export function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
