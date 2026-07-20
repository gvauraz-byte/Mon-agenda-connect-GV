import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchEvents, createEvent, updateEvent, deleteEvent, listCalendars } from './lib/caldav.js';
import { loadProjects, saveProjects, slugify } from './lib/projects.js';
import { isHoliday, isVacation } from './lib/holidays.js';
import { loadSubmissions, addSubmission, removeSubmission } from './lib/submissions.js';
import { renderAnnualPdf, getMonths, isoDate, daysBetween } from './lib/pdf.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/view/:token', (req, res) => {
  if (!process.env.SHARE_TOKEN || req.params.token !== process.env.SHARE_TOKEN) {
    return res.status(404).send('Page introuvable.');
  }
  res.sendFile(path.join(__dirname, 'views', 'view.html'));
});

app.get('/api/share-link', (req, res) => {
  if (!process.env.SHARE_TOKEN) return res.json({ configured: false });
  res.json({ configured: true, path: `/view/${process.env.SHARE_TOKEN}` });
});

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
    const { title, start, end, allDay, projectId, calendarUrl, location } = req.body;
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
      location,
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events', async (req, res) => {
  try {
    const { url, etag, uid, title, start, end, allDay, projectId, location } = req.body;
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
      location,
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

app.get('/api/submissions', (req, res) => {
  res.json(loadSubmissions());
});

app.post('/api/submissions', (req, res) => {
  const { title, projectLabel, start, end, allDay, startTime, endTime, location, contactName, contactEmail } = req.body;
  if (!title || !start) return res.status(400).json({ error: 'title et start requis' });
  const entry = addSubmission({
    title,
    projectLabel: projectLabel || '',
    start,
    end: end || start,
    allDay: Boolean(allDay),
    startTime: startTime || null,
    endTime: endTime || null,
    location: location || '',
    contactName: contactName || '',
    contactEmail: contactEmail || '',
  });
  res.json({ ok: true, id: entry.id });
});

app.delete('/api/submissions/:id', (req, res) => {
  const list = removeSubmission(req.params.id);
  res.json(list);
});

app.post('/api/submissions/:id/approve', async (req, res) => {
  try {
    const { projectId, newProjectName, newProjectColor, calendarUrl } = req.body;
    const submissions = loadSubmissions();
    const sub = submissions.find((s) => s.id === req.params.id);
    if (!sub) return res.status(404).json({ error: 'soumission introuvable' });

    let projects = loadProjects();
    let category;
    if (newProjectName) {
      const id = slugify(newProjectName);
      if (!projects.find((p) => p.id === id)) {
        projects.push({ id, name: newProjectName, color: newProjectColor || '#7F77DD' });
        saveProjects(projects);
      }
      category = newProjectName;
    } else if (projectId) {
      const project = projects.find((p) => p.id === projectId);
      category = project ? project.name : undefined;
    }

    let start = sub.start;
    let end = sub.end;
    if (!sub.allDay && sub.startTime) {
      start = new Date(`${sub.start}T${sub.startTime}:00`).toISOString();
      end = new Date(`${(sub.end || sub.start)}T${sub.endTime || sub.startTime}:00`).toISOString();
    }

    await createEvent({
      title: sub.title,
      start,
      end,
      allDay: sub.allDay,
      category,
      calendarUrl,
      location: sub.location,
    });

    removeSubmission(sub.id);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/export/pdf', async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    if (!year) return res.status(400).json({ error: 'year requis' });
    const activeProjectIds = (req.query.projects || '').split(',').filter(Boolean);
    const showHolidays = req.query.holidays === '1';
    const showVacations = req.query.vacations === '1';
    const zone = req.query.zone || 'B';

    const months = getMonths(year);
    const first = months[0];
    const last = months[11];
    const start = isoDate(first.y, first.m, 1) + 'T00:00:00Z';
    const lastDay = new Date(last.y, last.m + 1, 0).getDate();
    const end = isoDate(last.y, last.m, lastDay) + 'T23:59:59Z';

    const events = await fetchEvents({ start, end });
    const eventsByDay = {};
    events.forEach((ev) => {
      if (!ev.start) return;
      daysBetween(ev).forEach((day) => {
        if (!eventsByDay[day]) eventsByDay[day] = [];
        eventsByDay[day].push(ev);
      });
    });

    const projects = loadProjects();
    const holidaysMap = {};
    const vacationsMap = {};
    months.forEach((m) => {
      const daysInMonth = new Date(m.y, m.m + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = isoDate(m.y, m.m, d);
        if (showHolidays) {
          const h = isHoliday(dateStr);
          if (h) holidaysMap[dateStr] = h;
        }
        if (showVacations) {
          const v = isVacation(dateStr, zone);
          if (v) vacationsMap[dateStr] = v;
        }
      }
    });

    renderAnnualPdf({
      res,
      year,
      eventsByDay,
      projects,
      activeProjectIds,
      holidaysMap,
      vacationsMap,
      filename: `agenda-${first.y}-${last.y}.pdf`,
    });
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
