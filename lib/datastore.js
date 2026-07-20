import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const API_BASE = 'https://api.github.com';

function githubConfigured() {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

function localPath(name) {
  return path.join(DATA_DIR, name);
}

function readLocal(name, fallback) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  const p = localPath(name);
  if (!fs.existsSync(p)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch (err) {
    return fallback;
  }
}

function writeLocal(name, data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(localPath(name), JSON.stringify(data, null, 2));
}

async function githubGetFile(filePath) {
  const branch = process.env.GITHUB_BRANCH || 'main';
  const res = await fetch(
    `${API_BASE}/repos/${process.env.GITHUB_REPO}/contents/${filePath}?ref=${branch}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github+json',
      },
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Lecture GitHub echouee (${res.status})`);
  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf-8');
  return { content, sha: json.sha };
}

async function githubPutFile(filePath, contentStr, sha) {
  const branch = process.env.GITHUB_BRANCH || 'main';
  const res = await fetch(`${API_BASE}/repos/${process.env.GITHUB_REPO}/contents/${filePath}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Mise a jour ${filePath} (Agenda projets)`,
      content: Buffer.from(contentStr, 'utf-8').toString('base64'),
      sha: sha || undefined,
      branch,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ecriture GitHub echouee (${res.status}): ${text}`);
  }
}

export async function readData(name, fallback) {
  if (githubConfigured()) {
    try {
      const file = await githubGetFile(`data/${name}`);
      if (!file) return fallback;
      return JSON.parse(file.content);
    } catch (err) {
      console.error('Lecture GitHub impossible, repli sur le stockage local:', err.message);
    }
  }
  return readLocal(name, fallback);
}

export async function writeData(name, data) {
  const content = JSON.stringify(data, null, 2);
  if (githubConfigured()) {
    try {
      const existing = await githubGetFile(`data/${name}`);
      await githubPutFile(`data/${name}`, content, existing ? existing.sha : undefined);
      return;
    } catch (err) {
      console.error('Ecriture GitHub impossible, repli sur le stockage local:', err.message);
    }
  }
  writeLocal(name, data);
}

export function isDurable() {
  return githubConfigured();
}
