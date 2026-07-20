const START_YEAR = 2026;
const START_MONTH = 7;
const MONTH_NAMES = ['Janv','Fevr','Mars','Avr','Mai','Juin','Juil','Aout','Sept','Oct','Nov','Dec'];
const DOW = ['Di','Lu','Ma','Me','Je','Ve','Sa'];
const MAX_LINES = 3;

let projects = [];
let activeProjects = new Set();
let showHolidays = false;
let showVacations = false;
let vacationZone = 'B';
let periodYear = START_YEAR;
let eventsByDay = {};
let allEventsList = [];
let holidaysCache = {};
let vacationsCache = {};

function pad(n){ return String(n).padStart(2,'0'); }
function iso(y,m,d){ return `${y}-${pad(m+1)}-${pad(d)}`; }
function timeOf(isoStr){
  if(!isoStr) return '';
  return new Date(isoStr).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'});
}
function addDaysStr(dateStr, n){
  const d = new Date(dateStr+'T00:00:00Z');
  d.setUTCDate(d.getUTCDate()+n);
  return d.toISOString().slice(0,10);
}
function inclusiveEndDay(ev){
  if(!ev.end) return ev.start.slice(0,10);
  if(ev.allDay) return addDaysStr(ev.end.slice(0,10), -1);
  return ev.end.slice(0,10);
}
function daysBetween(ev){
  const startDay = ev.start.slice(0,10);
  const endDay = inclusiveEndDay(ev);
  if(endDay <= startDay) return [startDay];
  const days = [];
  let cur = startDay;
  let guard = 0;
  while(cur <= endDay && guard < 370){
    days.push(cur);
    cur = addDaysStr(cur, 1);
    guard++;
  }
  return days;
}
function getMonths(year){
  const list = [];
  for(let i=0;i<12;i++){
    const m = (START_MONTH + i) % 12;
    const y = year + Math.floor((START_MONTH + i) / 12);
    list.push({y, m});
  }
  return list;
}

async function api(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error('Erreur serveur');
  return res.json();
}

async function loadProjects(){
  projects = await api('/api/projects');
  activeProjects = new Set(projects.map(p=>p.id));
  renderProjectChips();
}

function renderProjectChips(){
  const wrap = document.getElementById('project-chips');
  wrap.innerHTML = '';
  projects.forEach(p=>{
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (activeProjects.has(p.id) ? '' : ' off');
    chip.innerHTML = `<span class="dot" style="background:${p.color}"></span>${p.name}`;
    chip.addEventListener('click', ()=>{
      if(activeProjects.has(p.id)) activeProjects.delete(p.id); else activeProjects.add(p.id);
      renderProjectChips();
      renderCalendar();
    });
    wrap.appendChild(chip);
  });
}

function renderExtraChips(){
  const wrap = document.getElementById('extra-chips');
  wrap.innerHTML = '';
  const holChip = document.createElement('button');
  holChip.type = 'button';
  holChip.className = 'chip' + (showHolidays ? '' : ' off');
  holChip.innerHTML = '<span class="dot" style="background:#E24B4A"></span>Jours feries';
  holChip.addEventListener('click', ()=>{ showHolidays = !showHolidays; renderExtraChips(); renderCalendar(); });
  wrap.appendChild(holChip);

  const vacChip = document.createElement('button');
  vacChip.type = 'button';
  vacChip.className = 'chip' + (showVacations ? '' : ' off');
  vacChip.innerHTML = '<span class="dot" style="background:#E24B4A"></span>Vacances scolaires';
  vacChip.addEventListener('click', ()=>{ showVacations = !showVacations; renderExtraChips(); renderCalendar(); });
  wrap.appendChild(vacChip);

  if(showVacations){
    const sel = document.createElement('select');
    sel.className = 'zone-select';
    ['A','B','C'].forEach(z=>{
      const opt = document.createElement('option');
      opt.value = z; opt.textContent = 'Zone ' + z;
      if(z === vacationZone) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', (e)=>{ vacationZone = e.target.value; renderCalendar(); });
    wrap.appendChild(sel);
  }
}

function projectByName(name){
  if(!name) return null;
  return projects.find(p => p.name.toLowerCase() === String(name).toLowerCase()) || null;
}

function periodRange(year){
  const months = getMonths(year);
  const first = months[0];
  const last = months[months.length-1];
  const start = iso(first.y, first.m, 1) + 'T00:00:00Z';
  const lastDay = new Date(last.y, last.m+1, 0).getDate();
  const end = iso(last.y, last.m, lastDay) + 'T23:59:59Z';
  return { start, end };
}

async function loadEvents(){
  const { start, end } = periodRange(periodYear);
  eventsByDay = {};
  allEventsList = [];
  try{
    const events = await api(`/api/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
    allEventsList = events.filter(ev=>ev.start);
    events.forEach(ev=>{
      if(!ev.start) return;
      daysBetween(ev).forEach(day=>{
        if(!eventsByDay[day]) eventsByDay[day] = [];
        eventsByDay[day].push(ev);
      });
    });
  } catch(e){ console.error(e); }
}

async function getHoliday(dateStr){
  if(dateStr in holidaysCache) return holidaysCache[dateStr];
  const h = await api('/api/holidays?date='+dateStr);
  holidaysCache[dateStr] = h;
  return h;
}
async function getVacation(dateStr, zone){
  const key = dateStr+'-'+zone;
  if(key in vacationsCache) return vacationsCache[key];
  const v = await api(`/api/vacation?date=${dateStr}&zone=${zone}`);
  vacationsCache[key] = v;
  return v;
}

function updatePeriodLabel(){
  const months = getMonths(periodYear);
  const first = months[0], last = months[months.length-1];
  document.getElementById('period-label').textContent =
    `${MONTH_NAMES[first.m]} ${first.y} - ${MONTH_NAMES[last.m]} ${last.y}`;
  document.getElementById('prev-btn').disabled = periodYear <= START_YEAR;
}

async function prefetchHolidaysVacations(months){
  const promises = [];
  for(const m of months){
    const daysInMonth = new Date(m.y, m.m+1, 0).getDate();
    for(let d=1; d<=daysInMonth; d++){
      const dateStr = iso(m.y, m.m, d);
      if(showHolidays && !(dateStr in holidaysCache)) promises.push(getHoliday(dateStr));
      if(showVacations) promises.push(getVacation(dateStr, vacationZone));
    }
  }
  await Promise.all(promises);
}

async function renderCalendar(){
  updatePeriodLabel();
  const months = getMonths(periodYear);
  if(showHolidays || showVacations) await prefetchHolidaysVacations(months);

  const table = document.getElementById('cal');
  table.innerHTML = '';
  const head = document.createElement('tr');
  months.forEach(m=>{
    const th = document.createElement('th');
    th.textContent = MONTH_NAMES[m.m] + ' ' + m.y;
    head.appendChild(th);
  });
  table.appendChild(head);

  for(let d=1; d<=31; d++){
    const row = document.createElement('tr');
    for(const m of months){
      const td = document.createElement('td');
      const daysInMonth = new Date(m.y, m.m+1, 0).getDate();
      if(d > daysInMonth){ row.appendChild(td); continue; }

      const dateStr = iso(m.y, m.m, d);
      const dateObj = new Date(m.y, m.m, d);
      const wd = DOW[dateObj.getDay()];
      const isWeekend = wd === 'Sa' || wd === 'Di';
      const isMonday = wd === 'Lu';

      const dayEvents = (eventsByDay[dateStr] || []).slice().sort((a,b)=> (a.start||'').localeCompare(b.start||''));

      let bg = isWeekend ? '#F1EFE8' : 'transparent';
      let border = 'border-bottom:1px solid #EFEEEA;';
      border += isMonday ? 'border-top:2px solid #B4B2A9;' : 'border-top:1px solid #F1EFE8;';

      let numColor = '#2C2C2A';
      let holLabel = '';
      if(showHolidays){
        const hol = holidaysCache[dateStr];
        if(hol){
          border += 'border-left:3px solid #E24B4A;';
          numColor = '#A32D2D';
          holLabel = `<div class="hol-label">${hol.name}</div>`;
        }
      }
      if(showVacations){
        const vac = vacationsCache[dateStr+'-'+vacationZone];
        if(vac){
          bg = 'repeating-linear-gradient(45deg, rgba(226,75,74,0.18) 0 1.5px, transparent 1.5px 5px)' + (bg !== 'transparent' ? ', '+bg : '');
        }
      }

      let linesHtml = '';
      const shown = dayEvents.slice(0, MAX_LINES);
      shown.forEach(ev=>{
        const proj = projectByName((ev.categories||[])[0]);
        const active = !proj || activeProjects.has(proj.id);
        if(!active) return;
        const color = proj ? proj.color : '#5F5E5A';
        const t = ev.allDay ? '' : timeOf(ev.start) + ' ';
        linesHtml += `<div class="ev-line" style="color:${color}"><span class="dot" style="background:${color}"></span>${t}${ev.title}</div>`;
      });
      if(dayEvents.length > MAX_LINES){
        linesHtml += `<div class="ev-more">+${dayEvents.length - MAX_LINES}</div>`;
      }

      td.style.cssText = `background:${bg};${border}`;
      td.innerHTML = `<div style="color:${numColor};font-weight:${holLabel?600:400};">${d} ${wd}</div>${holLabel}${linesHtml}`;
      td.addEventListener('click', ()=> openPanel(dateStr));
      row.appendChild(td);
    }
    table.appendChild(row);
  }
}

function openPanel(dateStr){
  showSheet('panel');
  const d = new Date(dateStr+'T12:00:00');
  document.getElementById('panel-date').textContent = d.toLocaleDateString('fr-FR', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
  const wrap = document.getElementById('panel-events');
  const evts = (eventsByDay[dateStr] || []).slice().sort((a,b)=> (a.start||'').localeCompare(b.start||''));
  if(!evts.length){
    wrap.innerHTML = '<p style="color:#888780;font-size:13px;">Aucun evenement ce jour.</p>';
    return;
  }
  wrap.innerHTML = '';
  evts.forEach(ev=>{
    const proj = projectByName((ev.categories||[])[0]);
    const timeLabel = ev.allDay ? 'Journee entiere' : (timeOf(ev.start) + (ev.end ? ' - ' + timeOf(ev.end) : ''));
    const row = document.createElement('div');
    row.className = 'ev-row';
    row.innerHTML = `
      <div class="row-top">
        <span class="dot" style="background:${proj ? proj.color : '#B4B2A9'}"></span>
        <span>${ev.title}</span>
        <span class="time">${timeLabel}</span>
      </div>
      ${ev.location ? `<div class="loc">${ev.location}</div>` : ''}
    `;
    wrap.appendChild(row);
  });
}

function renderListPanel(){
  const wrap = document.getElementById('list-events');
  const visible = allEventsList
    .filter(ev=>{
      const proj = projectByName((ev.categories||[])[0]);
      return !proj || activeProjects.has(proj.id);
    })
    .slice()
    .sort((a,b)=> (a.start||'').localeCompare(b.start||''));

  if(!visible.length){
    wrap.innerHTML = '<p style="font-size:13px;color:#888780;">Aucun evenement sur cette periode.</p>';
    return;
  }
  wrap.innerHTML = '';
  visible.forEach(ev=>{
    const proj = projectByName((ev.categories||[])[0]);
    const startDay = ev.start.slice(0,10);
    const endDay = inclusiveEndDay(ev);
    const dObj = new Date(startDay+'T12:00:00');
    let dateLabel = dObj.toLocaleDateString('fr-FR', {weekday:'short', day:'numeric', month:'short', year:'numeric'});
    if(endDay !== startDay){
      const eObj = new Date(endDay+'T12:00:00');
      dateLabel += ' au ' + eObj.toLocaleDateString('fr-FR', {weekday:'short', day:'numeric', month:'short', year:'numeric'});
    }
    const timeLabel = ev.allDay ? 'Journee entiere' : (timeOf(ev.start) + (ev.end ? ' - ' + timeOf(ev.end) : ''));
    const row = document.createElement('div');
    row.className = 'ev-row';
    row.innerHTML = `
      <div class="row-top">
        <span class="dot" style="background:${proj ? proj.color : '#B4B2A9'}"></span>
        <span style="font-weight:500;">${ev.title}</span>
      </div>
      <div style="font-size:12px;color:#888780;margin:2px 0 0 16px;">${dateLabel} - ${timeLabel}${ev.location ? ' - '+ev.location : ''}${proj ? ' - '+proj.name : ''}</div>
    `;
    wrap.appendChild(row);
  });
}
document.getElementById('list-view-btn').addEventListener('click', ()=>{
  showSheet('list-panel');
  renderListPanel();
});

function showSheet(id){
  document.getElementById(id).style.display = 'block';
  document.getElementById('overlay').style.display = 'block';
}
function hideSheets(){
  document.querySelectorAll('.sheet').forEach(s=> s.style.display = 'none');
  document.getElementById('overlay').style.display = 'none';
}
document.getElementById('overlay').addEventListener('click', hideSheets);
document.querySelectorAll('[data-close]').forEach(btn=> btn.addEventListener('click', hideSheets));

document.getElementById('prev-btn').addEventListener('click', async ()=>{
  if(periodYear <= START_YEAR) return;
  periodYear -= 1;
  await loadEvents();
  renderCalendar();
});
document.getElementById('next-btn').addEventListener('click', async ()=>{
  periodYear += 1;
  await loadEvents();
  renderCalendar();
});

(async function init(){
  await loadProjects();
  renderExtraChips();
  await loadEvents();
  await renderCalendar();
})();
