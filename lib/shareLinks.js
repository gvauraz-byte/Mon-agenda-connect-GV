import crypto from 'crypto';
import { readData, writeData } from './datastore.js';
import { loadProjects } from './projects.js';

const JOUR_MS = 24 * 60 * 60 * 1000;
const SEMAINE_MS = 7 * JOUR_MS;

// Un lien de partage ne doit pas vivre eternellement : le jeton finit toujours
// par trainer quelque part. Regle retenue le 06/09/2026 :
//   - lien qui ne couvre que des scenos  -> il meurt a la derniere livraison
//   - tout le reste                      -> une semaine
// avec un plancher d'une semaine dans les deux cas, sinon partager une sceno
// deja livree donnerait un lien mort-ne.

function finDeJournee(dateStr) {
  return new Date(`${dateStr}T23:59:59.999Z`).toISOString();
}

export async function computeExpiry(projectIds, from = new Date()) {
  const plancher = new Date(from.getTime() + SEMAINE_MS).toISOString();
  if (!Array.isArray(projectIds) || projectIds.length === 0) return plancher;
  const projects = await loadProjects();
  const livraisons = projectIds
    .map((id) => projects.find((p) => p.id === id))
    .filter((p) => p && p.livraison)
    .map((p) => finDeJournee(p.livraison))
    .sort();
  if (!livraisons.length) return plancher;
  const derniere = livraisons[livraisons.length - 1];
  return derniere > plancher ? derniere : plancher;
}

export function isExpired(link, now = new Date()) {
  if (!link || !link.expiresAt) return false;
  return new Date(link.expiresAt).getTime() <= now.getTime();
}

// Les liens crees avant cette regle n'ont pas d'expiration. On leur en pose une
// a la premiere lecture, calculee a partir d'aujourd'hui : ils gardent donc au
// moins une semaine de sursis au lieu de mourir d'un coup au deploiement.
export async function loadShareLinks() {
  const list = await readData('shareLinks.json', []);
  const aCompleter = list.filter((l) => !l.expiresAt);
  if (!aCompleter.length) return list;
  for (const link of aCompleter) {
    link.expiresAt = await computeExpiry(link.projectIds);
  }
  await writeData('shareLinks.json', list);
  return list;
}

export async function saveShareLinks(list) {
  await writeData('shareLinks.json', list);
}

export async function addShareLink({ label, projectIds, includeUntagged }) {
  const list = await loadShareLinks();
  const id = crypto.randomBytes(12).toString('base64url');
  const ids = Array.isArray(projectIds) ? projectIds : [];
  const entry = {
    id,
    label: label || '',
    projectIds: ids,
    includeUntagged: Boolean(includeUntagged),
    createdAt: new Date().toISOString(),
    expiresAt: await computeExpiry(ids),
  };
  list.push(entry);
  await saveShareLinks(list);
  return entry;
}

export async function findShareLink(id) {
  const list = await loadShareLinks();
  const link = list.find((l) => l.id === id) || null;
  if (!link) return null;
  return isExpired(link) ? null : link;
}

export async function extendShareLink(id, jours = 7) {
  const list = await loadShareLinks();
  const link = list.find((l) => l.id === id);
  if (!link) return null;
  const depart = Math.max(Date.now(), new Date(link.expiresAt || 0).getTime());
  link.expiresAt = new Date(depart + jours * JOUR_MS).toISOString();
  await saveShareLinks(list);
  return link;
}

export async function removeShareLink(id) {
  const list = (await loadShareLinks()).filter((l) => l.id !== id);
  await saveShareLinks(list);
  return list;
}

// Menage : on sort les liens perimes du fichier pour ne pas laisser des jetons
// morts dans le depot.
export async function purgeExpiredShareLinks() {
  const list = await loadShareLinks();
  const vivants = list.filter((l) => !isExpired(l));
  if (vivants.length !== list.length) await saveShareLinks(vivants);
  return vivants;
}
