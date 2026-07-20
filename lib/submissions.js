import { readData, writeData } from './datastore.js';

export async function loadSubmissions() {
  return readData('submissions.json', []);
}

export async function saveSubmissions(list) {
  await writeData('submissions.json', list);
}

export async function addSubmission(sub) {
  const list = await loadSubmissions();
  const id = `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry = { id, status: 'pending', submittedAt: new Date().toISOString(), ...sub };
  list.push(entry);
  await saveSubmissions(list);
  return entry;
}

export async function removeSubmission(id) {
  const list = (await loadSubmissions()).filter((s) => s.id !== id);
  await saveSubmissions(list);
  return list;
}
