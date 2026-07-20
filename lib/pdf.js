import PDFDocument from 'pdfkit';

const MONTH_NAMES = ['Janv','Fevr','Mars','Avr','Mai','Juin','Juil','Aout','Sept','Oct','Nov','Dec'];
const DOW = ['Di','Lu','Ma','Me','Je','Ve','Sa'];
const START_MONTH = 7;

function pad(n) {
  return String(n).padStart(2, '0');
}
export function isoDate(y, m, d) {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export function getMonths(year) {
  const list = [];
  for (let i = 0; i < 12; i++) {
    const m = (START_MONTH + i) % 12;
    const y = year + Math.floor((START_MONTH + i) / 12);
    list.push({ y, m });
  }
  return list;
}

function addDaysStr(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

function inclusiveEndDay(ev) {
  if (!ev.end) return ev.start.slice(0, 10);
  if (ev.allDay) return addDaysStr(ev.end.slice(0, 10), -1);
  return ev.end.slice(0, 10);
}

export function daysBetween(ev) {
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

function projectForEvent(ev, projects) {
  const cats = (ev.categories || []).map((c) => c.toLowerCase());
  if (!cats.length) return null;
  return projects.find((p) => cats.includes(p.name.toLowerCase())) || null;
}

export function renderAnnualPdf({ res, year, eventsByDay, projects, activeProjectIds, showUntagged, holidaysMap, vacationsMap, filename }) {
  const doc = new PDFDocument({ layout: 'landscape', size: 'A4', margin: 18 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  doc.pipe(res);

  const months = getMonths(year);
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pageHeight = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;
  const colWidth = pageWidth / 12;
  const titleHeight = 16;
  const headerHeight = 14;
  const rowHeight = (pageHeight - titleHeight - headerHeight) / 31;
  const startX = doc.page.margins.left;
  const startY = doc.page.margins.top + titleHeight;

  doc
    .fontSize(11)
    .fillColor('#2C2C2A')
    .text(`Agenda projets - ${months[0].y} / ${months[11].y}`, startX, doc.page.margins.top - 2);

  months.forEach((m, ci) => {
    const x = startX + ci * colWidth;
    doc
      .fontSize(7.5)
      .fillColor('#2C2C2A')
      .text(`${MONTH_NAMES[m.m]} ${m.y}`, x, startY, { width: colWidth, align: 'center' });
  });

  for (let d = 1; d <= 31; d++) {
    const y = startY + headerHeight + (d - 1) * rowHeight;
    months.forEach((m, ci) => {
      const x = startX + ci * colWidth;
      const daysInMonth = new Date(m.y, m.m + 1, 0).getDate();
      if (d > daysInMonth) return;

      const dateStr = isoDate(m.y, m.m, d);
      const dateObj = new Date(m.y, m.m, d);
      const wd = DOW[dateObj.getDay()];
      const isWeekend = wd === 'Sa' || wd === 'Di';

      const dayEvents = (eventsByDay[dateStr] || []).filter((ev) => {
        const proj = projectForEvent(ev, projects);
        if (!proj) return showUntagged !== false;
        return activeProjectIds.length === 0 || activeProjectIds.includes(proj.id);
      });
      const firstProj = dayEvents.length ? projectForEvent(dayEvents[0], projects) : null;

      if (firstProj) {
        doc.rect(x, y, colWidth, rowHeight).fillOpacity(0.35).fill(firstProj.color).fillOpacity(1);
      } else if (isWeekend) {
        doc.rect(x, y, colWidth, rowHeight).fill('#F1EFE8');
      }

      const hol = holidaysMap[dateStr];
      const vac = vacationsMap[dateStr];
      if (hol) {
        doc.rect(x, y, 2.2, rowHeight).fill('#E24B4A');
      } else if (vac) {
        doc.rect(x, y, 2.2, rowHeight).fill('#F0997B');
      }

      doc
        .fillColor(hol ? '#A32D2D' : '#2C2C2A')
        .fontSize(6)
        .text(`${d} ${wd}`, x + 3, y + 1, { width: colWidth - 5, lineBreak: false });

      if (dayEvents.length) {
        const label = dayEvents.map((e) => e.title).join(', ');
        doc
          .fontSize(5.3)
          .fillColor('#444441')
          .text(label, x + 3, y + 7, { width: colWidth - 5, height: Math.max(rowHeight - 8, 4), ellipsis: true });
      } else if (hol) {
        doc.fontSize(5.3).fillColor('#A32D2D').text(hol.name, x + 3, y + 7, { width: colWidth - 5, ellipsis: true });
      }

      doc.rect(x, y, colWidth, rowHeight).strokeColor('#E5E3DC').lineWidth(0.3).stroke();

      const hasConfirm = dayEvents.some((e) => e.status === 'a-confirmer');
      const hasOption = dayEvents.some((e) => e.status === 'option');
      const hasImportant = dayEvents.some((e) => e.status === 'important');
      if (hasConfirm) {
        doc.rect(x + colWidth - 1.4, y, 1.4, rowHeight).fill('#E8B93A');
      }
      if (hasOption) {
        doc.rect(x + colWidth - (hasConfirm ? 2.8 : 1.4), y, 1.4, rowHeight).fill('#185FA5');
      }
      if (hasImportant) {
        doc.rect(x, y, colWidth, rowHeight).strokeColor('#A32D2D').lineWidth(1).stroke();
      }
    });
  }

  doc.end();
}
