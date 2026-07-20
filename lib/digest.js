import { fetchEvents } from './caldav.js';
import { loadProjects } from './projects.js';

const DOW_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTH_NAMES = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];

function pad(n) {
  return String(n).padStart(2, '0');
}
function isoDate(d) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
function addDaysStr(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return isoDate(d);
}
function inclusiveEndDay(ev) {
  if (!ev.end) return ev.start.slice(0, 10);
  if (ev.allDay) return addDaysStr(ev.end.slice(0, 10), -1);
  return ev.end.slice(0, 10);
}
function daysBetween(ev) {
  const startDay = ev.start.slice(0, 10);
  const endDay = inclusiveEndDay(ev);
  if (endDay <= startDay) return [startDay];
  const days = [];
  let cur = startDay;
  let guard = 0;
  while (cur <= endDay && guard < 370) {
    days.push(cur);
    cur = addDaysStr(cur, 1);
    guard++;
  }
  return days;
}
function fmtTime(isoStr) {
  const d = new Date(isoStr);
  return `${pad(d.getUTCHours())}h${pad(d.getUTCMinutes())}`;
}
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function mondayOfWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

export async function buildWeeklyDigest(referenceDate = new Date()) {
  const monday = mondayOfWeek(referenceDate);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    days.push(d);
  }
  const dayStrs = days.map(isoDate);
  const start = dayStrs[0] + 'T00:00:00Z';
  const end = dayStrs[6] + 'T23:59:59Z';

  const [events, projects] = await Promise.all([
    fetchEvents({ start, end }),
    loadProjects(),
  ]);

  function projectForEvent(ev) {
    const cats = (ev.categories || []).map((c) => c.toLowerCase());
    if (!cats.length) return null;
    return projects.find((p) => cats.includes(p.name.toLowerCase())) || null;
  }

  const byDay = {};
  dayStrs.forEach((d) => { byDay[d] = []; });
  events.forEach((ev) => {
    if (!ev.start) return;
    daysBetween(ev).forEach((d) => {
      if (d in byDay) byDay[d].push(ev);
    });
  });

  let totalHours = 0;
  let conflictCount = 0;
  dayStrs.forEach((d) => {
    const dayEvents = byDay[d];
    const timed = dayEvents.filter((ev) => !ev.allDay && ev.start && ev.end).sort((a, b) => a.start.localeCompare(b.start));
    dayEvents.forEach((ev) => {
      if (ev.allDay) {
        totalHours += 3;
      } else if (ev.start && ev.end) {
        const diff = (new Date(ev.end) - new Date(ev.start)) / 3600000;
        if (diff > 0 && diff < 16) totalHours += diff;
      }
    });
    for (let i = 0; i < timed.length; i++) {
      for (let j = i + 1; j < timed.length; j++) {
        if (timed[j].start < timed[i].end && timed[i].start < timed[j].end) conflictCount++;
      }
    }
  });

  let bodyRowsHtml = '';
  let bodyText = '';
  days.forEach((d, idx) => {
    const dstr = dayStrs[idx];
    const dayEvents = byDay[dstr].slice().sort((a, b) => (a.start || '').localeCompare(b.start || ''));
    const label = `${DOW_FULL[d.getUTCDay()]} ${d.getUTCDate()} ${MONTH_NAMES[d.getUTCMonth()]}`;

    if (!dayEvents.length) {
      bodyRowsHtml += `<div style="padding:10px 0;border-bottom:1px solid #eee;"><p style="margin:0 0 4px;font-weight:600;font-size:14px;">${label}</p><p style="margin:2px 0 0;color:#999;font-size:13px;">Rien de prevu</p></div>`;
      bodyText += `${label} : rien de prevu\n`;
      return;
    }

    const itemsHtml = dayEvents.map((ev) => {
      const proj = projectForEvent(ev);
      const time = ev.allDay ? 'Journee entiere' : `${fmtTime(ev.start)}${ev.end ? ' - ' + fmtTime(ev.end) : ''}`;
      const projLabel = proj ? ` <span style="color:${proj.color};">&#9679; ${escapeHtml(proj.name)}</span>` : '';
      const loc = ev.location ? ` - ${escapeHtml(ev.location)}` : '';
      return `<p style="margin:2px 0;font-size:13px;"><strong>${escapeHtml(ev.title)}</strong> - ${time}${loc}${projLabel}</p>`;
    }).join('');
    bodyRowsHtml += `<div style="padding:10px 0;border-bottom:1px solid #eee;"><p style="margin:0 0 4px;font-weight:600;font-size:14px;">${label}</p>${itemsHtml}</div>`;

    bodyText += `${label} :\n` + dayEvents.map((ev) => {
      const time = ev.allDay ? 'journee entiere' : fmtTime(ev.start);
      return `  - ${ev.title} (${time}${ev.location ? ', ' + ev.location : ''})`;
    }).join('\n') + '\n';
  });

  const conflictLine = conflictCount
    ? `<p style="margin:0 0 18px;color:#A32D2D;font-size:13px;">&#9888; ${conflictCount} chevauchement(s) d'horaire cette semaine.</p>`
    : '';

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#2C2C2A;">
      <h2 style="margin:0 0 4px;">Semaine du ${dayStrs[0]} au ${dayStrs[6]}</h2>
      <p style="margin:0 0 8px;color:#888780;font-size:13px;">~${Math.round(totalHours)}h prevues cette semaine.</p>
      ${conflictLine}
      ${bodyRowsHtml}
      <p style="margin:18px 0 0;color:#B4B2A9;font-size:11px;">Resume automatique genere par l'agenda projets.</p>
    </div>
  `;

  const text = `Semaine du ${dayStrs[0]} au ${dayStrs[6]} (~${Math.round(totalHours)}h prevues)\n\n${bodyText}`;

  return {
    html,
    text,
    subject: `Semaine du ${dayStrs[0]} au ${dayStrs[6]}`,
    weekStart: dayStrs[0],
    weekEnd: dayStrs[6],
  };
}
