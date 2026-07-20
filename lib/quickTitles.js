import { readData, writeData } from './datastore.js';

const DEFAULT_QUICK_TITLES = [
  { id: 'qt-repetition', label: 'Repetition' },
  { id: 'qt-generale', label: 'Generale' },
  { id: 'qt-representation', label: 'Representation' },
  { id: 'qt-montage-decor', label: 'Montage decor' },
  { id: 'qt-demontage-decor', label: 'Demontage decor' },
  { id: 'qt-tournee', label: 'Tournee' },
];

const DIACRITICS_RE = new RegExp('[\\u0300-\\u036f]', 'g');

export function makeQuickTitleId(label) {
  const slug = String(label)
    .toLowerCase()
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `qt-${slug || 'titre'}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function loadQuickTitles() {
  return readData('quickTitles.json', DEFAULT_QUICK_TITLES);
}

export async function saveQuickTitles(list) {
  await writeData('quickTitles.json', list);
}
