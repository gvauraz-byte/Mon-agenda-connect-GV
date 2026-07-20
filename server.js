import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchEvents, createEvent, updateEvent, deleteEvent, listCalendars } from './lib/caldav.js';
import { loadProjects, saveProjects, slugify } from './lib/projects.js';
import { isHoliday, isVacation } from './lib/holidays.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, configured: Boolean(process.env.ICLOUD_USERNAME && process.env.ICLOUD_APP_PASSWORD) });
});

app.get('/api/calendars', async (req, res) => {
  try {
    const calendars = await listCalendars();
    res.json(calendars.map((c) => ({ url: c.url, displayName: c.displayName })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects', (req, res) => {
  res.json(loadProjects());
});

app.post('/api/projects', (req, res) => {
  const { name, color } = req.body;
  if (!name || !color) return res.status(400).json({ error: 'name et color requis' });
  const list = loadProjects();
  const id = slugify(name);
  if (!list.find((p) => p.id === id)) {
    list.push({ id, name, color });
    saveProjects(list);
  }
  res.json(list);
});

app.put('/api/projects/:id', (req, res) => {
  const { name, color } = req.body;
  const list = loadProjects();
  const project = list.find((p) => p.id === req.params.id);
  if (!project) return res.status(404).json({ error: 'projet introuvable' });
  if (name) project.name = name;
  if (color) project.color = color;
  saveProjects(list);
  res.json(list);
});

app.delete('/api/projects/:id', (req, res) => {
  let list = loadProjects();
  list = list.filter((p) => p.id !== req.params.id);
  saveProjects(list);
  res.json(list);
});

app.get('/api/events', async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) return res.status(400).json({ error: 'start et end requis (ISO)' });
    const events = await fetchEvents({ start, end });
    res.json(events);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { title, start, end, allDay, projectId, calendarUrl } = req.body;
    if (!title || !start) return res.status(400).json({ error: 'title et start requis' });
    const projects = loadProjects();
    const project = projects.find((p) => p.id === projectId);
    const result = await createEvent({
      title,
      start,
      end,
      allDay,
      category: project ? project.name : undefined,
      calendarUrl,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events', async (req, res) => {
  try {
    const { url, etag, uid, title, start, end, allDay, projectId } = req.body;
    if (!url || !uid || !title || !start) {
      return res.status(400).json({ error: 'url, uid, title et start requis' });
    }
    const projects = loadProjects();
    const project = projects.find((p) => p.id === projectId);
    const result = await updateEvent({
      url,
      etag,
      uid,
      title,
      start,
      end,
      allDay,
      category: project ? project.name : undefined,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/events/search', async (req, res) => {
  try {
    const { q, start, end } = req.query;
    if (!q || !start || !end) return res.status(400).json({ error: 'q, start et end requis' });
    const events = await fetchEvents({ start, end });
    const needle = q.toLowerCase();
    const matches = events.filter((ev) => (ev.title || '').toLowerCase().includes(needle));
    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events', async (req, res) => {
  try {
    const { url, etag } = req.body;
    if (!url) return res.status(400).json({ error: 'url requis' });
    const result = await deleteEvent({ url, etag });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/holidays', (req, res) => {
  const { date } = req.query;
  res.json(isHoliday(date));
});

app.get('/api/vacation', (req, res) => {
  const { date, zone } = req.query;
  res.json(isVacation(date, zone || 'B'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Agenda projets en ecoute sur le port ${PORT}`);
});
