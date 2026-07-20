import crypto from 'crypto';
import { readData, writeData } from './datastore.js';

export async function loadShareLinks() {
  return readData('shareLinks.json', []);
}

export async function saveShareLinks(list) {
  await writeData('shareLinks.json', list);
}

export async function addShareLink({ label, projectIds, includeUntagged }) {
  const list = await loadShareLinks();
  const id = crypto.randomBytes(12).toString('base64url');
  const entry = {
    id,
    label: label || '',
    projectIds: Array.isArray(projectIds) ? projectIds : [],
    includeUntagged: Boolean(includeUntagged),
    createdAt: new Date().toISOString(),
  };
  list.push(entry);
  await saveShareLinks(list);
  return entry;
}

export async function findShareLink(id) {
  const list = await loadShareLinks();
  return list.find((l) => l.id === id) || null;
}

export async function removeShareLink(id) {
  const list = (await loadShareLinks()).filter((l) => l.id !== id);
  await saveShareLinks(list);
  return list;
}
