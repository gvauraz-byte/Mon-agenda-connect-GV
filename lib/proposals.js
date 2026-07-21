import crypto from 'crypto';
import { readData, writeData } from './datastore.js';

export async function loadProposals() {
  return readData('proposals.json', []);
}

export async function saveProposals(list) {
  await writeData('proposals.json', list);
}

export async function addProposal(prop) {
  const list = await loadProposals();
  // Identifiant court pour un lien plus propre a partager (ex /p/aB3xQ9kd).
  const id = crypto.randomBytes(6).toString('base64url');
  const entry = { id, status: 'pending', createdAt: new Date().toISOString(), ...prop };
  list.push(entry);
  await saveProposals(list);
  return entry;
}

export async function findProposal(id) {
  const list = await loadProposals();
  return list.find((p) => p.id === id) || null;
}

export async function updateProposal(id, patch) {
  const list = await loadProposals();
  const prop = list.find((p) => p.id === id);
  if (!prop) return null;
  Object.assign(prop, patch);
  await saveProposals(list);
  return prop;
}

export async function removeProposal(id) {
  const list = (await loadProposals()).filter((p) => p.id !== id);
  await saveProposals(list);
  return list;
}
